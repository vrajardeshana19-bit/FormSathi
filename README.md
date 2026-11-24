# FormSaathi – Voice-First Browser Form Agent

<p align="center">

**Making online forms accessible through voice, guidance and intelligent automation.**

A Chrome extension that understands online forms, explains questions in simple language, and helps users complete them through voice or text — while keeping the user in control.

</p>

<p align="center">

![Status](https://img.shields.io/badge/Status-In%20Development-orange)
![Platform](https://img.shields.io/badge/Platform-Chrome%20Extension-blue)
![Frontend](https://img.shields.io/badge/Frontend-React%20%7C%20TypeScript-3178C6)
![Backend](https://img.shields.io/badge/Backend-FastAPI-009688)
![AI](https://img.shields.io/badge/AI-Gemini-4285F4)
![Voice](https://img.shields.io/badge/Voice-ElevenLabs-black)

</p>

---

## What is FormSaathi?

Online forms are an essential part of everyday life. From scholarship applications and college admissions to government services, people are constantly expected to fill out complicated digital forms.

But not everyone finds these forms easy to understand.

Complicated terminology, unfamiliar questions, language barriers and lengthy application processes can make even a simple form frustrating.

**FormSaathi aims to change that.**

FormSaathi is a voice-first browser assistant that works alongside online forms. It understands the fields, explains what they mean in simple language, listens to the user's answers and helps enter the information correctly.

Instead of making users figure out every field themselves, FormSaathi guides them through the form one question at a time.

## The idea

Imagine a student opening a scholarship application with 14 fields.

Instead of struggling with unfamiliar questions, the student activates FormSaathi.

The assistant scans the form and says:

*"I found 14 fields in this application. Let's complete them one by one."*

It explains each question, listens to the student's response, confirms what it understood and fills the field only after approval.

The user can skip questions, repeat explanations, type answers instead of speaking, and manually enter sensitive information.

**The objective is simple: make completing online forms easier, more understandable and more accessible.**

---

## How it works

```text
Open an online form
        |
        v
Activate FormSaathi
        |
        v
Scan and understand form fields
        |
        v
Explain the current question
        |
        v
User responds through voice or text
        |
        v
AI interprets and normalises the answer
        |
        v
Read back the understood answer
        |
        v
User confirms
        |
        v
Fill and highlight the field
        |
        v
Repeat until the form is complete
        |
        v
Review the application
        |
        v
User submits manually
```

## Core features

| Feature | Description |
|---|---|
| Form Detection | Identifies standard HTML form fields on a webpage. |
| Simple Explanations | Explains complicated questions in understandable language. |
| Voice Interaction | Allows users to answer questions by speaking. |
| Text Input | Provides an alternative when voice input is unavailable. |
| Smart Answer Mapping | Converts answers into appropriate formats and matches available options. |
| Confirmation Before Filling | Shows the interpreted answer and waits for user approval. |
| Field Highlighting | Highlights completed fields and tracks progress. |
| Sensitive Field Protection | Skips sensitive fields and asks users to enter them manually. |
| Application Review | Provides a final review before manual submission. |

---

## Technology Stack

The following technologies are planned for the MVP.

### Browser Extension
- Chrome Extension Manifest V3
- React
- TypeScript
- Tailwind CSS
- Chrome Extensions API
- DOM APIs

### Backend
- Python
- FastAPI
- Pydantic

### AI and Voice
- Gemini – question understanding and answer interpretation
- ElevenLabs – text-to-speech
- Web Speech API – browser-based speech recognition

*The final implementation may evolve as development and testing progress.*

---

## System Architecture

```text
                  USER
                   |
                   v
          CHROME EXTENSION
          -----------------
          React Side Panel
          Microphone Controls
          Progress Tracking
          Review Interface
                   |
                   v
          CHROME CONTENT SCRIPT
          ---------------------
          Form Scanner
          Field Schema Builder
          Fill Engine
          Field Highlighter
          Safety Checks
                   |
                   v
          BACKGROUND SERVICE WORKER
          -------------------------
          Message Routing
          Tab Management
          API Communication
                   |
                   v
             FASTAPI BACKEND
             ---------------
             Request Validation
             Question Understanding
             Answer Interpretation
             Normalisation
             Response Generation
                   |
             +-----+------+
             |            |
             v            v
          GEMINI      ELEVENLABS
          AI Logic    Voice Output
```

The extension handles browser interaction, while the backend handles AI-based understanding and answer processing.

---

## Project Structure

The repository will follow a modular structure to keep frontend, extension and backend development independent.

```text
FormSaathi/
│
├── extension/
│   ├── public/
│   │   └── manifest.json
│   │
│   ├── src/
│   │   ├── background/
│   │   │   └── worker.ts
│   │   │
│   │   ├── content/
│   │   │   ├── scanner.ts
│   │   │   └── fill.ts
│   │   │
│   │   ├── sidepanel/
│   │   │   ├── components/
│   │   │   ├── pages/
│   │   │   ├── hooks/
│   │   │   ├── services/
│   │   │   └── styles/
│   │   │
│   │   └── shared/
│   │
│   ├── package.json
│   └── tsconfig.json
│
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── planner.py
│   │   ├── normalise.py
│   │   ├── match.py
│   │   ├── llm.py
│   │   ├── tts.py
│   │   └── sensitive.py
│   │
│   ├── requirements.txt
│   └── .env.example
│
├── demo/
│   └── scholarship-form/
│
├── docs/
│   └── architecture.md
│
├── .gitignore
└── README.md
```

*This is the planned structure; files and modules will be added as implementation progresses.*

---

## Team Responsibilities

We are developing FormSaathi as a two-member team with clearly separated ownership.

### Member 1 – Vraj Ardeshana

**Frontend, Chrome Extension and Product Development**

- Chrome Extension architecture and Manifest V3 setup.
- Complete UI/UX design and React development.
- Side panel and user interaction workflows.
- DOM-based form scanning and field detection.
- Browser-side form filling and field highlighting.
- User confirmation and review system.
- Client-side safety checks and submit protection.
- Backend API integration.
- End-to-end product testing and integration.

### Member 2 – Backend and AI Development

**Backend, AI Processing and Voice Services**

- FastAPI backend architecture.
- Gemini integration.
- Form question explanation.
- Spoken and typed answer interpretation.
- Answer normalisation and validation.
- Dropdown and option matching.
- ElevenLabs text-to-speech integration.
- Backend safety checks and API documentation.

Both members will contribute to testing, integration, documentation and the final demonstration.

---

## MVP Development Goals

The first working version will focus on completing one end-to-end form successfully.

- [ ] Chrome Extension setup.
- [ ] Side panel UI.
- [ ] Form field scanner.
- [ ] Structured field schema.
- [ ] FastAPI backend.
- [ ] Gemini question explanation.
- [ ] Voice input.
- [ ] ElevenLabs voice output.
- [ ] Answer interpretation and normalisation.
- [ ] User confirmation workflow.
- [ ] Form filling and field highlighting.
- [ ] Sensitive-field protection.
- [ ] Final review screen.
- [ ] Manual submission protection.
- [ ] Mock scholarship application demonstration.

Advanced features will be considered only after the core workflow is reliable.

---

## Privacy and User Control

FormSaathi is designed around user consent and control.

- Users review interpreted answers before fields are filled.
- Sensitive information such as passwords, OTPs, identity details and payment information is excluded from AI processing.
- Sensitive fields are left for manual entry.
- FormSaathi does not automatically submit applications.
- The user remains responsible for reviewing and submitting the final application.
- Webpage content is treated as untrusted input.

Privacy and safety are part of the product architecture, not optional add-ons.

---

## Current Development Status

<badge color="warning">Under active development</badge>

FormSaathi is currently in its MVP development phase.

The initial focus is building the Chrome extension, establishing the backend API contract and implementing the complete voice-guided form-filling workflow.

Updates, screenshots and demonstration links will be added here as development progresses.

---

## Hackathon

**Event:** wHACKiest 2026  
**Track:** Track 2 – Beyond the Browser

FormSaathi explores how browser extensions can go beyond traditional browsing by actively assisting users with real-world digital tasks.

---

## Future Scope

Once the MVP is stable, potential improvements include:

- Additional Indian language support.
- Multi-page form assistance.
- Accessibility modes.
- Local profile storage with user consent.
- Better handling of validation errors.
- Form completion insights and time-saving metrics.
- Partnerships with educational institutions, NGOs and digital service centres.


---

<p align="center">

**FormSaathi – Your forms. Your language. Your control.**

*Making digital forms easier for everyone.*

</p>
