# Breeze ChMS MCP Server Examples

This document provides practical examples of how to use the Breeze ChMS MCP Server tools.

## People Management Examples

### 1. List All Active Members

```json
{
  "tool": "list_people",
  "arguments": {
    "details": 1,
    "filter_json": "{\"tag_contains\": \"member\"}"
  }
}
```

### 2. Add a New Person with Complete Information

**IMPORTANT: `add_person` reliably sets profile fields (e.g. `multiple_choice` for status). Contact
fields (phone, email, address) must be set in a subsequent `update_person` call — they are silently
ignored when passed to `add_person`.**

```json
// Step 1: Create the person with profile fields only
{
  "tool": "add_person",
  "arguments": {
    "first": "Sarah",
    "last": "Johnson",
    "fields_json": "[{\"field_id\":\"218827608\",\"field_type\":\"multiple_choice\",\"response\":\"32\"}]"
  }
}

// Step 2: Set contact fields using the returned person ID
{
  "tool": "update_person",
  "arguments": {
    "person_id": "<id from step 1>",
    "fields_json": "[{\"field_id\":\"1179914680\",\"field_type\":\"email_primary\",\"response\":\"sarah.johnson@example.com\"},{\"field_id\":\"984378195\",\"field_type\":\"phone_mobile\",\"response\":\"(555) 123-4567\"},{\"field_id\":\"1279661039\",\"field_type\":\"address\",\"response\":true,\"details\":{\"street_address\":\"123 Main St\",\"city\":\"Anytown\",\"state\":\"CA\",\"zip\":\"90210\"}}]"
  }
}
```

### 3. Update Person's Information

```json
{
  "tool": "update_person",
  "arguments": {
    "person_id": "12345678",
    "fields_json": "[{\"field_id\":\"1179914680\",\"field_type\":\"email_primary\",\"response\":\"newemail@example.com\"}]"
  }
}
```

### 4. Search for People by Name

**Name search via `filter_json` does NOT work — the API returns `false` for any name-based
filter. To find a person by name, paginate through all records and scan manually:**

```json
{
  "tool": "list_people",
  "arguments": {
    "details": 0,
    "limit": 200,
    "offset": 0
  }
}
// Repeat with offset: 200, 400, 600... until the response is an empty array.
// Results are returned alphabetically by last name.
```

## Tag Management Examples

### 5. Create a Tag Hierarchy

```json
// First create a folder
{
  "tool": "add_tag_folder",
  "arguments": {
    "name": "Ministries"
  }
}

// Then add tags to the folder (use folder_id from previous response)
{
  "tool": "add_tag",
  "arguments": {
    "name": "Youth Ministry",
    "folder_id": "12345"
  }
}
```

### 6. Bulk Tag Assignment

```json
// Assign multiple people to a small group
{
  "tool": "assign_tag",
  "arguments": {
    "person_id": "11111111",
    "tag_id": "567890"
  }
}
// Repeat for each person
```

## Event Management Examples

### 7. Create a Weekly Service

```json
{
  "tool": "add_event",
  "arguments": {
    "name": "Sunday Morning Service",
    "starts_on": "1640577600",
    "category_id": "0"
  }
}
```

### 8. Check Multiple People Into an Event

```json
// Check in a family
{
  "tool": "checkin_person",
  "arguments": {
    "person_id": "12345678",
    "instance_id": "98765432",
    "direction": "in"
  }
}
```

### 9. Get Event Attendance Report

```json
{
  "tool": "get_event_attendance",
  "arguments": {
    "instance_id": "98765432",
    "details": true,
    "type": "person"
  }
}
```

## Family Management Examples

### 10. Create a New Family

```json
{
  "tool": "create_family",
  "arguments": {
    "people_ids_json": "[\"12345678\", \"87654321\", \"11223344\"]"
  }
}
```

### 11. Add Children to Existing Family

```json
{
  "tool": "add_to_family",
  "arguments": {
    "people_ids_json": "[\"99887766\", \"55443322\"]",
    "target_person_id": "12345678"
  }
}
```

## Volunteer Management Examples

### 12. Schedule Volunteers for Sunday Service

```json
// Schedule a volunteer
{
  "tool": "schedule_volunteer",
  "arguments": {
    "instance_id": "98765432",
    "person_id": "12345678"
  }
}
```

### 13. Get Volunteer List for Event

```json
{
  "tool": "list_volunteers",
  "arguments": {
    "instance_id": "98765432"
  }
}
```

## Contribution/Giving Examples

### 14. Record a Cash Offering

```json
{
  "tool": "add_contribution",
  "arguments": {
    "date": "2024-01-21",
    "person_json": "{\"name\":\"John Doe\",\"email\":\"john@example.com\"}",
    "method": "Cash",
    "amount": 150.00,
    "funds_json": "[{\"name\":\"General Fund\",\"amount\":100},{\"name\":\"Missions Fund\",\"amount\":50}]",
    "batch_name": "Sunday Offering - Jan 21"
  }
}
```

### 15. Record Online Giving

```json
{
  "tool": "add_contribution",
  "arguments": {
    "date": "2024-01-21",
    "person_json": "{\"name\":\"Jane Smith\",\"email\":\"jane@example.com\"}",
    "uid": "stripe_cus_12345",
    "processor": "Stripe",
    "method": "Credit Card",
    "amount": 200.00,
    "funds_json": "[{\"name\":\"General Fund\",\"amount\":200}]",
    "group": "2024-03",
    "batch_name": "Online Giving - March 2024"
  }
}
```

## Form Management Examples

### 16. Get All Form Submissions

```json
// First get the forms
{
  "tool": "list_forms",
  "arguments": {
    "is_archived": 0
  }
}

// Then get entries for a specific form
{
  "tool": "list_form_entries",
  "arguments": {
    "form_id": "12345"
  }
}
```

## Activity Tracking Examples

### 17. Audit Recent Changes

```json
{
  "tool": "list_activity",
  "arguments": {
    "action": "person_updated",
    "start": "2024-01-01",
    "end": "2024-01-31",
    "details": 1,
    "limit": 100
  }
}
```

### 18. Track Contribution Activity

```json
{
  "tool": "list_activity",
  "arguments": {
    "action": "contribution_added",
    "start": "2024-01-01",
    "limit": 500
  }
}
```

## Complex Workflow Examples

### 19. New Member Onboarding Workflow

```json
// Step 1: Add the person (profile/status fields only)
{
  "tool": "add_person",
  "arguments": {
    "first": "Michael",
    "last": "Wilson",
    "fields_json": "[{\"field_id\":\"218827608\",\"field_type\":\"multiple_choice\",\"response\":\"2\"}]"
  }
}

// Step 1b: Set contact info via update_person (required — add_person ignores these)
{
  "tool": "update_person",
  "arguments": {
    "person_id": "<id from step 1>",
    "fields_json": "[{\"field_id\":\"1179914680\",\"field_type\":\"email_primary\",\"response\":\"michael.wilson@example.com\"}]"
  }
}

// Step 2: Tag as new member (use person_id from step 1 response)
{
  "tool": "assign_tag",
  "arguments": {
    "person_id": "new_person_id_here",
    "tag_id": "new_member_tag_id"
  }
}

// Step 3: Add to newcomers small group
{
  "tool": "assign_tag",
  "arguments": {
    "person_id": "new_person_id_here", 
    "tag_id": "newcomers_group_tag_id"
  }
}
```

### 20. Event Check-in Workflow

```json
// Step 1: Get event details
{
  "tool": "get_event",
  "arguments": {
    "instance_id": "98765432",
    "details": 1,
    "eligible": 1
  }
}

// Step 2: Check in multiple family members
{
  "tool": "checkin_person",
  "arguments": {
    "person_id": "parent_id",
    "instance_id": "98765432"
  }
}

{
  "tool": "checkin_person", 
  "arguments": {
    "person_id": "child1_id",
    "instance_id": "98765432"
  }
}

// Step 3: Generate attendance report
{
  "tool": "get_event_attendance",
  "arguments": {
    "instance_id": "98765432",
    "details": true
  }
}
```

## Data Import Examples

### 21. Import Contact List

For bulk imports, create the person first, then set contact fields separately:

```json
// Step 1: For each contact in your source data:
{
  "tool": "add_person",
  "arguments": {
    "first": "Contact_FirstName",
    "last": "Contact_LastName",
    "fields_json": "[{\"field_id\":\"218827608\",\"field_type\":\"multiple_choice\",\"response\":\"STATUS_OPTION_ID\"}]"
  }
}

// Step 2: Set contact info using the returned person ID
{
  "tool": "update_person",
  "arguments": {
    "person_id": "<id from step 1>",
    "fields_json": "[{\"field_id\":\"1179914680\",\"field_type\":\"email_primary\",\"response\":\"contact@example.com\"},{\"field_id\":\"984378195\",\"field_type\":\"phone_mobile\",\"response\":\"(555) 000-0000\"},{\"field_id\":\"1279661039\",\"field_type\":\"address\",\"response\":true,\"details\":{\"street_address\":\"123 Main St\",\"city\":\"City\",\"state\":\"ST\",\"zip\":\"12345\"}}]"
  }
}
```

## Error Handling Examples

### 22. Handling Common Errors

```json
// This will fail if person_id doesn't exist
{
  "tool": "get_person",
  "arguments": {
    "person_id": "invalid_id"
  }
}
// Response: {"error": "Person not found"}

// This will fail if you exceed rate limits
// Solution: Add delays between requests or batch operations
```

## Field ID Reference

To work with custom fields, you need their field IDs. Get them with:

```json
{
  "tool": "list_profile_fields",
  "arguments": {}
}
```

### Confirmed working field_type names and response formats

These are the field_type values and response shapes that **actually work** with `update_person`
(verified through live testing):

| field_type | response | details | Notes |
|---|---|---|---|
| `multiple_choice` | `"OPTION_ID"` (string) | — | Use the numeric option_id from `list_profile_fields` |
| `email_primary` | `"user@example.com"` | — | Plain string shorthand (verified working) |
| `phone_mobile` | `"(555) 123-4567"` | — | Plain string shorthand (verified working) |
| `address` | `true` | `{"street_address":"...","city":"...","state":"...","zip":"..."}` | **Must use details object** |

**Address format — CRITICAL:**
```json
{"field_id": "FIELD_ID", "field_type": "address", "response": true, "details": {"street_address": "123 Main St", "city": "Dallas", "state": "GA", "zip": "30132"}}
```
Using `"field_type": "address_primary"` with a flat string response saves data but **renders broken
on the Breeze frontend** (displays as "Address / 1 / 1, 1 1"). Always use `"address"` + `details`.

**What does NOT work:**
- `"field_type": "email"` with a plain string response → silently ignored (need `details` object)
- `"field_type": "phone"` with a plain string response → silently ignored (need `details` object)
- `"field_type": "address_primary"` with a flat string → **saves but breaks frontend display**
- Array responses: `{"response": [{"address": "..."}]}` → ignored

**Example — updating multiple fields at once:**
```json
[
  {"field_id": "218827608", "field_type": "multiple_choice", "response": "32"},
  {"field_id": "1179914680", "field_type": "email_primary",  "response": "user@example.com"},
  {"field_id": "984378195",  "field_type": "phone_mobile",   "response": "(770) 555-1234"},
  {"field_id": "1279661039", "field_type": "address", "response": true, "details": {"street_address": "123 Main St", "city": "Dallas", "state": "GA", "zip": "30132"}}
]
```

## Rate Limiting Best Practices

Remember the 20 requests/minute limit:

```javascript
// Example: Process large list with delays
const people = await getAllPeopleToUpdate();
for (let i = 0; i < people.length; i++) {
  await updatePerson(people[i]);
  
  // Wait 3.5 seconds between requests
  if (i < people.length - 1) {
    await new Promise(resolve => setTimeout(resolve, 3500));
  }
}
```

These examples should help you get started with the Breeze ChMS MCP Server. Remember to always test with small datasets first and handle errors gracefully in your implementations.
