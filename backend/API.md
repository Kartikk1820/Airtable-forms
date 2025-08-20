# API Documentation

Base URL

- Local: `http://localhost:5000`
- All endpoints are prefixed with `/api`

Authentication

- Session-based using `express-session`.
- Login via Airtable OAuth: `GET /api/auth/airtable/login`
- After completing OAuth in the browser, a session cookie `connect.sid` is set.
- For Postman, copy the `connect.sid` cookie from your browser and attach it to requests for protected endpoints.

Content Types

- JSON: `Content-Type: application/json`
- Multipart (file upload): `multipart/form-data` (file field name must be `attachment`)

Environment Variables (Backend)

- `PORT`, `MONGO_URL`, `SECRET`
- `AIRTABLE_CLIENT_ID`, `AIRTABLE_CLIENT_SECRET`, `AIRTABLE_REDIRECT_URI`
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`

---

Auth (Airtable OAuth)

GET /api/auth/airtable/login

- Description: Starts OAuth with Airtable (state + PKCE). Redirects the user to Airtable.
- Auth: Public
- Response: 302 Redirect to Airtable consent screen

GET /api/auth/airtable/callback

- Description: OAuth callback from Airtable; exchanges code for tokens; stores user in DB; sets session `userId`.
- Auth: Public (invoked by Airtable)
- Response: 302 Redirect to `/dashboard`
- Errors: 400/500 with a brief message when provider returns error or exchange fails

GET /api/auth/airtable/me

- Description: Returns the logged-in user document from MongoDB.
- Auth: Session required
- Response 200:

```json
{
  "_id": "...",
  "airtableUserId": "usr...",
  "name": "...",
  "email": "...",
  "accessToken": "...",
  "refreshToken": "...",
  "createdAt": "...",
  "updatedAt": "..."
}
```

- Response 401: `{ "message": "Not logged in" }`

---

Airtable Integration

GET /api/airtable/bases

- Description: List Airtable bases accessible by the authenticated user.
- Auth: Session required
- Response 200 (Airtable passthrough):

```json
{ "bases": [{ "id": "app...", "name": "..." }] }
```

GET /api/airtable/tables?baseId={baseId}

- Description: List tables for a base.
- Auth: Session required
- Query: `baseId` (required)
- Response 200 (Airtable schema including fields):

```json
{
  "tables": [
    {
      "id": "tbl...",
      "name": "Students",
      "primaryFieldId": "fld...",
      "fields": [{ "id": "fld...", "name": "Name", "type": "singleLineText" }]
    }
  ]
}
```

GET /api/airtable/{baseId}/{tableId}/fields

- Description: Get table schema/fields.
- Auth: Session required
- Response 200:

```json
{
  "id": "tbl...",
  "name": "Students",
  "primaryFieldId": "fld...",
  "fields": [ { "id": "fld...", "name": "Name", "type": "singleLineText" } ],
  "views": [ ... ]
}
```

- Errors: 404/403/500 with helpful messages

---

Forms (Private)

POST /api/forms

- Description: Create a new form definition bound to an Airtable base/table.
- Auth: Session required
- Body (JSON) example:

```json
{
  "baseId": "app...",
  "tableId": "tbl...",
  "title": "Task Management Form",
  "slug": "task-management",
  "fields": [
    {
      "id": "name",
      "airtableFieldId": "fldName",
      "label": "Task Name",
      "type": "short_text",
      "required": true
    },
    {
      "id": "description",
      "airtableFieldId": "fldDescription",
      "label": "Task Description",
      "type": "long_text"
    },
    {
      "id": "status",
      "airtableFieldId": "fldStatus",
      "label": "Status",
      "type": "single_select",
      "options": ["Todo", "In Progress", "Done"]
    },
    {
      "id": "tags",
      "airtableFieldId": "fldTags",
      "label": "Tags",
      "type": "multi_select",
      "options": ["Frontend", "Backend", "Urgent"]
    },
    {
      "id": "attachments",
      "airtableFieldId": "fldAttachments",
      "label": "Attachments",
      "type": "attachment"
    }
  ]
}
```

- Alternatively: `multipart/form-data` with optional file under key `attachment` plus text fields.
- Responses:
  - 200: Created form document
  - 400: `{ "error": "Form with this slug already exists" }`
  - 400: `{ "error": "Invalid conditional logic", ... }`

GET /api/forms

- Description: List forms owned by current user.
- Auth: Session required
- Response 200: Array of form documents

GET /api/forms/{id}

- Description: Get a form by ID.
- Auth: Session required
- Response 200: Form document
- Response 404: `{ "error": "Form not found" }`

POST /api/forms/builder/preview

- Description: Validate form structure against Airtable schema and conditional logic before saving.
- Auth: Session required
- Body:

```json
{
  "baseId": "app...",
  "tableId": "tbl...",
  "fields": [
    {
      "id": "name",
      "type": "short_text",
      "label": "Name",
      "airtableFieldId": "fld...",
      "required": true
    },
    {
      "id": "status",
      "type": "single_select",
      "label": "Status",
      "airtableFieldId": "fld...",
      "options": ["Todo", "In Progress", "Done"]
    },
    {
      "id": "github",
      "type": "short_text",
      "label": "GitHub URL",
      "visibleIf": {
        "questionId": "role",
        "operator": "equals",
        "value": "Engineer"
      }
    }
  ]
}
```

- Response 200:

```json
{
  "validationResults": [ { "fieldId": "name", "isValid": true, "airtableType": "singleLineText", "compatible": true } ],
  "tableSchema": { ... },
  "conditionalLogic": { "isValid": true, "dependencies": { ... } },
  "isValid": true,
  "summary": { "totalFields": 3, "validFields": 3, "invalidFields": 0, "conditionalLogicValid": true }
}
```

GET /api/forms/{id}/schema

- Description: Get form schema for frontend rendering, including conditional logic and dependencies.
- Auth: Session required
- Response 200:

```json
{
  "id": "...",
  "title": "...",
  "slug": "...",
  "fields": [
    {
      "id": "status",
      "label": "Status",
      "type": "single_select",
      "options": ["Todo", "In Progress", "Done"],
      "airtableFieldId": "fld..."
    }
  ],
  "dependencies": { "role": ["github"] }
}
```

POST /api/forms/{id}/visible-fields

- Description: Compute visible fields for given answers (conditional logic).
- Auth: Session required
- Body:

```json
{ "formData": { "role": "Engineer" } }
```

- Response 200:

```json
{ "formId": "...", "visibleFields": [ { "id": "github", "label": "GitHub URL" } ], "totalFields": 5, "dependencies": { ... } }
```

POST /api/forms/{id}/validate

- Description: Validate submission values against required fields, options, and conditional logic.
- Auth: Session required
- Body example (supports array or comma-separated string for multi_select):

```json
{
  "name": "John Doe",
  "description": "A computer science student working on web development",
  "status": "In Progress",
  "tags": ["Frontend", "Backend"],
  "attachments": ""
}
```

- Response 200:

```json
{
  "isValid": true,
  "errors": [],
  "fieldCount": 5,
  "visibleFieldCount": 5,
  "submissionFieldCount": 5
}
```

- Response 200 (invalid):

```json
{ "isValid": false, "errors": ["Status has an invalid option: ..."], ... }
```

GET /api/forms/{id}/submissions

- Description: List submissions saved locally for a form (owner-only).
- Auth: Session required
- Response 200: Array of submissions

---

Forms (Public)

GET /api/forms/public/{slug}

- Description: Get public form definition by slug.
- Auth: Public
- Response 200: Form document
- Response 404: `{ "error": "Form not found" }`

POST /api/forms/public/{slug}/submit

- Description: Submit answers to a public form. Saves file to Cloudinary and creates an Airtable record using the form owner’s access token. Also persists a local submission.
- Auth: Public
- Content-Type: `multipart/form-data` or `application/json`
- File field (optional): `attachment` (jpg, png, jpeg, pdf)
- Text fields: match your form field `id` values (e.g., `name`, `description`, `status`, `tags`).
  - For multi-select: accepts either an array (JSON) or a comma-separated string (e.g., `"Frontend,Backend"`).
- Response 200 (success):

```json
{
  "message": "Submission stored successfully in Airtable and locally!",
  "attachment": "https://res.cloudinary.com/...",
  "airtableRecord": { ... },
  "localSubmission": { ... },
  "fields": { "fld...": "..." }
}
```

- Response 200 (Airtable failure but saved locally):

```json
{
  "message": "File uploaded and saved locally, but failed to store in Airtable",
  "attachment": "https://res.cloudinary.com/...",
  "localSubmission": { ... },
  "error": "Airtable storage failed",
  "errorDetails": "..."
}
```

---

Field Types Supported

- `short_text` → Airtable: `singleLineText`, `email`, `phoneNumber`
- `long_text` → `multilineText`
- `single_select` → `singleSelect` (must match options exactly)
- `multi_select` → `multipleSelects` (array or comma-separated string)
- `attachment` → `multipleAttachments` (uploads via Cloudinary)

Conditional Logic

- Each field may include `visibleIf`:

```json
{ "questionId": "role", "operator": "equals", "value": "Engineer" }
```

- Operators supported: `equals`, `not_equals`, `contains`, `not_contains`, `in`, `not_in`, `starts_with`, `ends_with`, `greater_than`, `less_than`, `greater_than_or_equal`, `less_than_or_equal`

Errors

- Standard error shape (examples):
  - 400: `{ "error": "Invalid request body", "message": "..." }`
  - 401: `{ "error": "Not authenticated" }`
  - 403: `{ "error": "Access denied" }`
  - 404: `{ "error": "Form not found" }`
  - 500: `{ "error": "Failed to ..." }`

Notes

- Use `attachment` as the file key for uploads.
- For protected endpoints, ensure `connect.sid` cookie is present.
- Use the Airtable endpoints to fetch `baseId`, `tableId`, and field IDs (`fld...`).
