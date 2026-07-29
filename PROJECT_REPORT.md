# Project Report

**Project Title:** Silent SOS – Smart Emergency Alert & Live Location Sharing System
**Prepared By:** Ankita Srishti
**Version:** 1.0

---

## 1. Abstract

Silent SOS is a web-based emergency response platform enabling users to silently trigger an emergency alert and share their live location with trusted contacts via SMS and email, addressing the gap left by voice-dependent emergency systems. This report documents the problem addressed, the system's design and implementation, the technology used, testing performed, results achieved, and directions for future work.

## 2. Introduction

Personal-safety emergencies — harassment, stalking, domestic violence, medical crises — often occur in situations where speaking aloud is unsafe or impossible. Silent SOS was conceived to let a user request help through a single silent interaction: a click or a 3-second long-press, after which the system automatically notifies pre-selected trusted contacts with the user's live location.

## 3. Problem Statement

Existing emergency mechanisms assume the victim can speak and clearly communicate their location. This assumption fails in many real emergencies. There is a need for a lightweight, silent, and reliable alerting mechanism accessible from an ordinary smartphone or computer.

## 4. Objectives

- Enable a silent, single-action emergency trigger.
- Deliver reliable, redundant notifications (SMS and email) within seconds.
- Provide continuous live location sharing for the duration of an emergency.
- Offer both a personal user experience and an institutional oversight (admin) capability.
- Build the system following a professional software development lifecycle, with full supporting documentation.

## 5. Literature / Existing Systems Review (Summary)

Existing personal-safety apps typically require the user to speak, dial a number, or navigate multiple screens under stress. Government emergency numbers (e.g., 112/911) are voice-first. Some commercial safety apps exist but are often region-locked, subscription-based, or lack live continuous tracking with dual-channel (SMS + email) redundancy. Silent SOS differentiates itself through its single-interaction silent trigger and dual notification channel design.

## 6. System Design Summary

The system follows a layered client-server architecture: a React frontend, an Express/Node.js REST API, a MongoDB database, and integrations with Twilio (SMS), Nodemailer (email), Google Maps API (location), and Socket.IO (real-time updates). Full detail is provided in the System Architecture Document (HLD), Low-Level Design (LLD), and Database Design Document.

## 7. Implementation Summary

- **Frontend:** React-based responsive UI implementing registration/login, contact management, the SOS trigger control, a live-tracking map view, alert history, and (for admins) a real-time active-alerts dashboard.
- **Backend:** Express REST API implementing authentication (JWT), contact CRUD, SOS trigger orchestration, location updates, and alert lifecycle management.
- **Notification Service:** a dedicated module wrapping Twilio and Nodemailer, dispatching alerts to all of a user's emergency contacts with a live Google Maps link.
- **Real-time layer:** Socket.IO rooms scoped per alert, broadcasting live location updates to subscribed dashboard clients.

## 8. Testing Summary

Testing was conducted across unit, integration, system, security, and performance levels, with particular emphasis on the SOS-trigger-to-notification path (see Test Plan & Test Cases). Key validated outcomes:

- SOS trigger reliably created an alert and dispatched notifications within the target latency window.
- Failure of a single notification channel (e.g., simulated SMS failure) did not prevent the other channel (email) from delivering the alert.
- Role-based access control correctly separated user and admin capabilities.
- The system sustained the target concurrency in load testing without breaching performance thresholds (see Non-Functional Requirements for specific targets).

## 9. Results

The implemented system successfully demonstrates: silent, single-action alerting; dual-channel redundant notification; continuous live location sharing during an active alert; and a functioning institutional oversight dashboard. These results validate the core hypothesis that a lightweight web platform can meaningfully close the "cannot speak to call for help" gap.

## 10. Challenges Faced

- Balancing notification speed against reliability when a third-party channel (SMS) intermittently fails, resolved via a dual-channel dispatch and retry strategy.
- Ensuring live location updates remain performant and low-latency at scale, addressed via Socket.IO room scoping rather than broadcasting to all connected clients.
- Designing an interface that is unmistakably operable in an emergency, yet doesn't visually broadcast "emergency mode" in a way that could escalate risk if observed by a threat.

## 11. Limitations

- No offline/SMS-only fallback if the user has no internet connectivity (Phase 2 item).
- No direct integration with official police/emergency services in Phase 1.
- No native mobile application in Phase 1 (web-based, responsive only).

## 12. Future Scope

- Progressive Web App and native Android/iOS apps.
- Offline SMS-based triggering without requiring internet connectivity.
- Voice-activated triggering and multi-language support.
- AI-based threat/danger prediction.
- Direct integration with police or official emergency dispatch systems.
- Wearable device support (e.g., a discreet physical trigger button).
- Geofencing and family safety groups.

## 13. Conclusion

Silent SOS demonstrates that a focused, well-architected web application — built with a conventional, widely available technology stack — can meaningfully improve personal-safety response by removing the requirement to speak or navigate complex interfaces during an emergency. The project was executed with documentation and process rigor modeled on professional software engineering practice, spanning business requirements through deployment and maintenance planning.

## 14. References

- Product Requirements Document (this documentation set).
- Software Requirements Specification, IEEE 830 structure (this documentation set).
- Twilio API Documentation.
- Google Maps Platform Documentation.
- MongoDB Documentation.

## 15. Appendices

See the accompanying documentation set (Business Requirements Document, PRD, SRS, FRS, NFR, User Stories, UI/UX Design Specification, System Architecture Document, Low-Level Design, Database Design Document, API Documentation, Security Design Document, Test Plan, Deployment Guide, CI/CD Documentation, User Manual, Admin Manual, Maintenance & Operations Guide) for full supporting detail.
