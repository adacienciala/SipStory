# Product Requirements Document (PRD) - SipStory (MVP)

## 1. Product Overview

SipStory is a responsive web application designed for matcha enthusiasts in Europe. It serves as a specialized digital journal for systematically documenting, tracking, and comparing matcha tasting experiences. The Minimum Viable Product (MVP) focuses on providing a personal, authenticated space for users to manage their own tasting notes. The platform addresses the lack of dedicated tools that capture matcha-specific characteristics such as umami, foam quality, and color. The application will be built using a modern tech stack including Astro, React, TypeScript, and Supabase for the backend and authentication.

## 2. User Problem

Matcha consumers, particularly those investing in premium products, lack a tailored method to record and recall their tasting experiences. General-purpose tea or note-taking apps do not provide structured fields for matcha-specific attributes. This makes it difficult for users to remember the nuances between different brands and blends, track which expensive products offer the best value, and consistently avoid low-quality matcha. Without a dedicated tool, users cannot effectively compare products side-by-side based on their own notes, leading to uninformed repeat purchases and a diminished tasting journey.

## 3. Functional Requirements

### 3.1. User Account Management

- 3.1.1. Users must be able to register, log in, and manage their passwords. This functionality will be handled by Supabase Auth.
- 3.1.2. All routes related to creating, viewing, and managing tasting notes must be protected, accessible only to authenticated users.

### 3.2. Onboarding

- 3.2.1. Upon their first login, new users must be presented with a single, mandatory onboarding screen.
- 3.2.2. The onboarding screen will provide a brief explanation of key tasting concepts (umami, bitterness) and a guide on how to create a new tasting entry.

### 3.3. Tasting Notes (CRUD)

- 3.3.1. Create: Users must be able to create a new tasting entry through a dedicated form.
  - Mandatory fields: Matcha Brand (text), Matcha Blend (text), Overall Rating (1-5 stars).
  - Optional fields: Region of Origin (text), Umami (1-5 dots), Bitter (1-5 dots), Sweet (1-5 dots), Foam Quality (1-5 dots), Notes as Koicha (text area), Notes with Milk (text area), Price Paid per 100g (number, PLN), Purchase Location/Source (text).
- 3.3.2. Read: Users must have a dashboard view that lists all their personal tasting entries, sorted chronologically by creation date (newest first) by default. Users must be able to click on an entry to see a detailed view of all its fields.
- 3.3.3. Update: Users must be able to edit all fields of any existing tasting entry they have created.
- 3.3.4. Delete: Users must be able to permanently delete any tasting entry they have created.

### 3.4. Core Features

- 3.4.1. Comparison Tool: Users must be able to select any two of their tasting entries from the main list. This action will navigate them to a new view that displays the selected entries in a two-column layout for direct, side-by-side comparison.
- 3.4.2. Filtering and Sorting: The dashboard list of tasting notes must be filterable by:
  - Matcha Brand (multi-select from a list of the user's previously entered brands).
  - Region of Origin (multi-select from a list of the user's previously entered regions).
  - Minimum Star Rating (e.g., show all tastings >= 4 stars).
- 3.4.3. Input Assistance: The 'Matcha Brand', 'Matcha Blend', and 'Region of Origin' text fields in the creation/edit form must feature an autocomplete function that suggests values from the user’s own entry history.

### 3.5. Technical Requirements

- 3.5.1. Tech Stack: Astro (Framework), React (UI), TypeScript, Tailwind CSS, Shadcn/ui, Supabase (Backend & Auth).
- 3.5.2. Platform: The application must be a responsive web interface, optimized for mobile (e.g., 390px width) and desktop (e.g., 1440px width) viewports.
- 3.5.3. CI/CD: An automated pipeline for building and testing is required. It must include three end-to-end (E2E) tests covering:
  - Login -> Create a new tasting.
  - Get a tasting -> Edit the tasting.
  - Get a tasting -> Delete the tasting.
- 3.5.4. Deployment: The application must be deployed to a public URL.

## 4. Product Boundaries

The following features and functionalities are explicitly out of scope for the MVP release to ensure a focused and timely launch.

- Photo Uploads: Users cannot upload images with their tasting notes.
- Community Features: There will be no sharing of notes between users, forums, or direct messaging.
- Admin Moderation: There will be no centralized system for curating a master list of brands or blends. Data consistency is managed per-user via autocomplete.
- Advanced Features: Matcha availability trackers, sample swap networks, café locators, and personal inventory management are excluded.
- Native Mobile Apps: No dedicated iOS or Android applications will be developed.
- Third-Party Integrations: No integration with retailer APIs or other external services.

## 5. User Stories

### User Account & Onboarding

- ID: US-001
- Title: New User Registration
- Description: As a new visitor, I want to create an account using my email and a password so that I can access the application and save my tasting notes.
- Acceptance Criteria:
  - Given I am on the registration page, I see fields for email and password.
  - When I enter a valid email and a secure password and submit the form.
  - Then my account is created, and I am automatically logged in.
  - And I am redirected to the onboarding screen.

- ID: US-002
- Title: Existing User Login
- Description: As a registered user, I want to log in with my email and password so that I can access my previously saved tasting notes.
- Acceptance Criteria:
  - Given I am on the login page, I see fields for email and password.
  - When I enter my correct credentials and submit the form.
  - Then I am authenticated and redirected to my main tasting notes dashboard.

- ID: US-003
- Title: Secure Access to Tasting Notes
- Description: As a logged-in user, I want my tasting notes to be private and only accessible to me.
- Acceptance Criteria:
  - Given I am not logged in.
  - When I try to access a URL for the dashboard or a specific tasting note.
  - Then I am redirected to the login page.
  - Given I am logged in.
  - When I access the dashboard, I can only see the notes that I have created.

- ID: US-004
- Title: First-Time User Onboarding
- Description: As a user without any tasting notes on the dashboard, I want to see a single onboarding screen that explains the app's purpose and key terms so I understand how to get started.
- Acceptance Criteria:
  - Given I have just registered and logged in for the first time, no tasting notes.
  - Then I am presented with a mandatory, single-page onboarding view.
  - And this view explains concepts like 'umami' and 'foam quality'.
  - And it shows a brief guide on how to log a new entry.
  - When I acknowledge the screen (e.g., click a "Get Started" button), I am taken to creating a new tasitng note screen.

### Tasting Notes Management (CRUD)

- ID: US-005
- Title: Create a New Tasting Note
- Description: As a user, I want to add a new tasting note by filling out a form with details about the matcha I tried, so I can keep a record of my experience.
- Acceptance Criteria:
  - Given I am on my dashboard, there is a clear button or link to "Add New Tasting".
  - When I click it, I am taken to a form with all the fields specified in the functional requirements.
  - And the 'Matcha Brand', 'Matcha Blend', and 'Overall Rating' fields are marked as required.
  - When I fill in the required fields and click "Save".
  - Then the new tasting note is saved to my account.
  - And I am redirected back to my dashboard, where the new entry appears at the top of the list.

- ID: US-006
- Title: View Tasting Notes List
- Description: As a user, I want to see a list of all my tasting notes on a central dashboard so I can get an overview of my tasting history.
- Acceptance Criteria:
  - Given I am logged in, my main view is a dashboard listing all my tasting notes.
  - And the notes are sorted chronologically by default, with the most recent entry first.
  - And each list item displays key information, such as Matcha Brand, Blend, and Overall Rating.

- ID: US-007
- Title: View Tasting Note Details
- Description: As a user, I want to click on a specific entry in my dashboard to view all the details I recorded for that tasting.
- Acceptance Criteria:
  - Given I am on my dashboard.
  - When I click on a tasting note entry.
  - Then I am navigated to a detailed view for that specific entry.
  - And this view displays all the fields associated with the note (Brand, Blend, Ratings, Notes, Price, etc.).

- ID: US-008
- Title: Edit an Existing Tasting Note
- Description: As a user, I want to be able to edit a tasting note I've previously saved to correct mistakes or add more information.
- Acceptance Criteria:
  - Given I am viewing the details of a specific tasting note.
  - When I click an "Edit" button.
  - Then I am presented with the same form used for creation, pre-filled with the existing data.
  - When I make changes and click "Save".
  - Then the entry is updated with the new information.
  - And I am returned to the detail view or the dashboard, where the changes are reflected.

- ID: US-009
- Title: Delete a Tasting Note
- Description: As a user, I want to permanently delete a tasting note that I no longer need.
- Acceptance Criteria:
  - Given I am viewing the details or list view of my tasting notes.
  - When I click a "Delete" button associated with an entry.
  - Then I am shown a confirmation prompt (e.g., "Are you sure you want to delete this entry?").
  - When I confirm the deletion.
  - Then the tasting note is permanently removed from my account.
  - And I am returned to the updated dashboard view.

### Core App Features

- ID: US-010
- Title: Compare Two Tasting Notes
- Description: As a user, I want to select any two of my tasting notes and view them side-by-side to easily compare their attributes.
- Acceptance Criteria:
  - Given I am on the dashboard view.
  - When I select two entries via a dedicated mechanism (e.g., checkboxes and a "Compare" button).
  - Then I am navigated to a new comparison view.
  - And this view displays the data for the two selected entries in a two-column layout.
  - And all fields for both entries are visible for direct comparison.

- ID: US-011
- Title: Filter Tastings by Brand, Region, and Rating
- Description: As a user with many entries, I want to filter my list of tastings to quickly find specific notes.
- Acceptance Criteria:
  - Given I am on the dashboard.
  - When I use the filter controls to select a specific brand, region, or minimum star rating.
  - Then the list of tasting notes dynamically updates to show only the entries that match the selected criteria.
  - And I can clear the filters to return to the full, unfiltered list.

- ID: US-012
- Title: Autocomplete Input Fields
- Description: As a user creating or editing a tasting, I want the Brand, Blend, and Region fields to suggest my previously used entries to ensure consistency and speed up data entry.
- Acceptance Criteria:
  - Given I am on the create/edit form.
  - When I start typing in the 'Matcha Brand', 'Matcha Blend', or 'Region of Origin' field.
  - Then a dropdown appears suggesting values I have previously entered for that specific field.
  - When I select a suggestion, the field is populated with that value.

### Edge Cases

- ID: US-013
- Title: Form Validation for Required Fields
- Description: As a user, I want to be prevented from submitting the new tasting form if I haven't filled out the mandatory fields.
- Acceptance Criteria:
  - Given I am on the "Create New Tasting" form.
  - When I try to submit the form without filling in 'Matcha Brand', 'Matcha Blend', or 'Overall Rating'.
  - Then the form is not submitted.
  - And a clear error message is displayed next to each required field that is empty.

## 6. Success Metrics

The success of the SipStory MVP will be measured against the following Key Performance Indicators (KPIs) within one month of the official launch.

- Launch Date: The application is successfully deployed and publicly accessible by the target date of November 16th, 2025.
- User Adoption: Achieve a 10% user acquisition rate from a unique tracking link shared on the project owner's TikTok profile.
- Database Growth: The application's database contains at least 10 unique brand-blend combinations submitted by the user base (excluding test data from the development team).
