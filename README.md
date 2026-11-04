# Mobile Driver Analytics System

## Project Overview

The Mobile Driver Analytics System is a mobile application project for monitoring driving behaviour using a smartphone. The main idea is to use a phone instead of a separate device installed in a vehicle.

The application is planned to collect driving information such as speed, location, and acceleration while a driver is on a trip. After a trip, the system will use this information to provide a driving score and show the driver details about their driving behaviour.

Drivers will also be able to choose whether they want to share their driving information with an insurance company. Insurance administrators will only be able to view information from drivers who have given permission.

This README describes the current project plan and analysis. **Development has not started yet**, so the features and technical design below are planned and have not been implemented or tested.

## Course and Team Information

- **Course:** SENG71000 - Systems Analysis and Design
- **Project:** Mobile Driver Analytics System
- **Phase:** Phase 2 - Analysis
- **Section:** 1
- **Group:** 1
- **Professor:** Akrem El-Ghazal

### Group Members

- Jacob Stekelenburg
- Fabio Bustamante Romillo
- Kadeema Wakha
- Raj Bahadur Bhat

## Main Goals

The project is intended to:

- Record trip information using a smartphone.
- Track information such as speed, location, and acceleration.
- Calculate a driving score out of 100.
- Show drivers their trip history and driving statistics.
- Let drivers review the details behind their driving score.
- Allow drivers to control whether their information is shared with an insurance company.
- Give insurance administrators access only to information shared with their permission.

## Planned User Roles

### Driver

A driver will be able to create an account, log in, record trips, view trip history, check driving scores, compare trips, and manage data-sharing consent.

### Insurance Administrator

An insurance administrator will be able to view information from customers who have agreed to share their driving data. They will not have access to every driver's information by default.

### External Services

The system is also expected to use external services for mapping and road speed-limit information. The services have not been selected yet.

## Planned Features

The Phase 2 analysis identified the following main use cases:

1. Register an account.
2. Log in.
3. Record a trip.
4. View trip history.
5. View trip details and route.
6. View driving score breakdown.
7. Compare trips.
8. Manage sharing consent.
9. View customers who have given consent.
10. Review customer driving information.

These are planned features. They are not available in a working application yet.

## Requirements

The Phase 2 report includes functional requirements FR01-FR12 and non-functional requirements NFR01-NFR08. These requirements describe what the system should do and the quality expectations for the system.

The requirements will need to be reviewed and updated as the project moves forward.

## Planned Technology

The current technology choices identified in Phase 2 are:

| Area | Planned Technology |
|---|---|
| Mobile application | React Native |
| Mobile application language | TypeScript |
| Backend | Node.js with Express |
| Backend language | JavaScript |
| Database | PostgreSQL through Supabase |
| Authentication | Supabase Auth |

The mapping service and road speed-limit data source have not been selected yet.

## Planned System Design

The analysis includes a proposed domain model with classes such as:

- User
- Driver
- InsuranceAdministrator
- InsuranceCompany
- SharingConsent
- Trip
- TripSample
- DrivingEvent
- DrivingScore
- ScoreComponent

The proposed database structure includes:

- `profiles`
- `insurance_companies`
- `sharing_consents`
- `trips`
- `trip_samples`
- `driving_events`
- `driving_scores`
- `score_components`

Supabase Auth is planned to handle user authentication. User passwords will not be stored directly in the application database.

These models and tables are part of the current design and may change during development.

## Planned Application Screens

The application is expected to include the following screens:

- Registration and Login
- Driver Dashboard
- Active Trip
- Trip History
- Trip Details and Driving Score
- Compare Driving Statistics
- Sharing Settings
- Consenting Customers
- Customer Driving Information

The screens and wireframes are still part of the design work. They have not been implemented.

## Development Plan

The team is following a sprint-based approach. The first sprint is planned around the basic account and dashboard functionality.

### Sprint 1

**Planned dates:** November 2-6, 2026

**Sprint goal:** Set up registration, login, logout, and a protected dashboard connected to Supabase.

The proposed Sprint 1 user stories are:

- US01 - Register an account.
- US02 - Log in and log out.
- US03 - Access a protected dashboard.

The Phase 2 report lists these as proposed sprint tasks. The work has not started yet, and task owners and Azure Board IDs still need to be confirmed.

### Future Work

Later sprints are expected to cover the other planned features, including trip recording, trip history, driving scores, trip comparisons, and consent-based insurance access. The backlog and sprint plans may be updated as the team makes progress.

## Current Project Status

At this stage, the project is in the analysis and planning phase.

Completed or prepared so far:

- Phase 1 project vision.
- Phase 2 requirements analysis.
- Identification of system actors and use cases.
- Proposed domain model and database structure.
- Initial technology choices.
- Initial sprint planning.

Not started yet:

- Application development.
- Backend implementation.
- Database setup.
- Supabase authentication setup.
- UI implementation.
- Trip tracking and driving score functionality.
- Testing and working demonstrations.

No application features should be considered completed until they have been developed and tested.

## Next Steps

The team's next steps include:

1. Finalize the diagrams and remaining analysis documents.
2. Confirm task owners and Azure Board IDs.
3. Set up the project repository and development environment.
4. Start Sprint 1 development.
5. Connect the application to Supabase.
6. Test the features as they are developed.
7. Update this README as the project progresses.

## Note

This README will be updated as the project moves from analysis and planning into development. The technologies, requirements, design, and sprint plans may change based on the team's decisions and progress.
