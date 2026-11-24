import pytest
from app.planner import create_form_plan, find_target_field_by_query, parse_user_command
from app.schemas import FormField


def test_command_parsing():
    assert parse_user_command("skip") == ("skip", None)
    assert parse_user_command("next please")[0] == "skip"
    assert parse_user_command("repeat that")[0] == "repeat"
    assert parse_user_command("say again")[0] == "repeat"
    assert parse_user_command("go back")[0] == "back"
    assert parse_user_command("stop")[0] == "stop"
    assert parse_user_command("explain more")[0] == "explain"

    cmd, arg = parse_user_command("change email")
    assert cmd == "change"
    assert arg == "email"

    assert parse_user_command("My name is Rahul") is None


def test_planner_ordering_and_depends_on():
    f1 = FormField(id="f1", label="Full Name", required=True)
    f2 = FormField(id="f2", label="State", required=True)
    f3 = FormField(id="f3", label="District", required=True, depends_on="f2")
    f4 = FormField(id="f4", label="Hobbies", required=False)

    plan = create_form_plan([f1, f3, f2, f4])
    # Parent f2 must come before dependent f3
    assert plan.index("f2") < plan.index("f3")
    # Required fields should precede purely optional f4
    assert plan.index("f1") < plan.index("f4")
    assert plan.index("f2") < plan.index("f4")


def test_planner_group_integrity():
    f_date_day = FormField(id="dob_day", label="Day", group_id="dob")
    f_date_mon = FormField(id="dob_mon", label="Month", group_id="dob")
    f_date_yr = FormField(id="dob_yr", label="Year", group_id="dob")
    f_other = FormField(id="phone", label="Phone")

    plan = create_form_plan([f_date_day, f_other, f_date_mon, f_date_yr])
    # Group members should be placed together
    assert abs(plan.index("dob_day") - plan.index("dob_mon")) == 1
    assert abs(plan.index("dob_mon") - plan.index("dob_yr")) == 1


def test_find_target_field_by_query():
    fields = [
        FormField(id="f1", label="Full Name", semantic_type="name"),
        FormField(id="f2", label="Email Address", semantic_type="email"),
        FormField(id="f3", label="Mobile Number", semantic_type="phone"),
    ]
    assert find_target_field_by_query("email", fields) == "f2"
    assert find_target_field_by_query("phone", fields) == "f3"
    assert find_target_field_by_query("name", fields) == "f1"
