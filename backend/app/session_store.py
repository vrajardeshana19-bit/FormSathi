import json
import logging
import time
from typing import Any, Dict, List, Optional
from app.config import settings
from app.schemas import FormField

logger = logging.getLogger("formsaathi.session_store")


class SessionData:
    def __init__(
        self,
        session_id: str,
        url: Optional[str] = None,
        title: Optional[str] = None,
        language: str = "en-IN",
        fields: Optional[List[FormField]] = None,
        fields_plan: Optional[List[str]] = None,
    ):
        self.session_id = session_id
        self.url = url
        self.title = title
        self.language = language
        self.fields: Dict[str, FormField] = {f.id: f for f in (fields or [])}
        self.fields_plan: List[str] = fields_plan or []
        self.current_index: int = 0
        self.history: List[Dict[str, Any]] = []  # records each turn: field_id, value, status, timestamp
        self.created_at: float = time.time()
        self.updated_at: float = time.time()

    def to_dict(self) -> Dict[str, Any]:
        return {
            "session_id": self.session_id,
            "url": self.url,
            "title": self.title,
            "language": self.language,
            "fields": {k: v.model_dump() for k, v in self.fields.items()},
            "fields_plan": self.fields_plan,
            "current_index": self.current_index,
            "history": self.history,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "SessionData":
        fields_data = [FormField(**f) for f in data.get("fields", {}).values()]
        inst = cls(
            session_id=data["session_id"],
            url=data.get("url"),
            title=data.get("title"),
            language=data.get("language", "en-IN"),
            fields=fields_data,
            fields_plan=data.get("fields_plan", []),
        )
        inst.current_index = data.get("current_index", 0)
        inst.history = data.get("history", [])
        inst.created_at = data.get("created_at", time.time())
        inst.updated_at = data.get("updated_at", time.time())
        return inst


class SessionStore:
    def __init__(self):
        self._memory_store: Dict[str, SessionData] = {}
        self._dynamodb_table = None

        if settings.DYNAMODB_SESSION_TABLE:
            try:
                import boto3
                dynamodb = boto3.resource("dynamodb", region_name=settings.AWS_REGION)
                self._dynamodb_table = dynamodb.Table(settings.DYNAMODB_SESSION_TABLE)
                logger.info(f"Initialized DynamoDB session table: {settings.DYNAMODB_SESSION_TABLE}")
            except Exception as e:
                logger.warning(f"Could not connect to DynamoDB ({e}). Falling back to memory store.")
                self._dynamodb_table = None

    def create(self, session: SessionData) -> SessionData:
        self._memory_store[session.session_id] = session
        if self._dynamodb_table:
            try:
                self._dynamodb_table.put_item(Item={
                    "session_id": session.session_id,
                    "payload": json.dumps(session.to_dict()),
                    "updated_at": int(session.updated_at)
                })
            except Exception as e:
                logger.warning(f"DynamoDB put_item failed: {e}")
        return session

    def get(self, session_id: str) -> Optional[SessionData]:
        if session_id in self._memory_store:
            return self._memory_store[session_id]

        if self._dynamodb_table:
            try:
                resp = self._dynamodb_table.get_item(Key={"session_id": session_id})
                if "Item" in resp and "payload" in resp["Item"]:
                    data = json.loads(resp["Item"]["payload"])
                    session = SessionData.from_dict(data)
                    self._memory_store[session_id] = session
                    return session
            except Exception as e:
                logger.warning(f"DynamoDB get_item failed: {e}")

        return None

    def update(self, session: SessionData) -> None:
        session.updated_at = time.time()
        self._memory_store[session.session_id] = session
        if self._dynamodb_table:
            try:
                self._dynamodb_table.put_item(Item={
                    "session_id": session.session_id,
                    "payload": json.dumps(session.to_dict()),
                    "updated_at": int(session.updated_at)
                })
            except Exception as e:
                logger.warning(f"DynamoDB update failed: {e}")

    def delete(self, session_id: str) -> None:
        self._memory_store.pop(session_id, None)
        if self._dynamodb_table:
            try:
                self._dynamodb_table.delete_item(Key={"session_id": session_id})
            except Exception as e:
                logger.warning(f"DynamoDB delete_item failed: {e}")


session_store = SessionStore()
