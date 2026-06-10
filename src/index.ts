#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
import axios, { AxiosInstance, AxiosRequestConfig } from "axios";

/**
 * MCP Server for Breeze ChMS API
 *
 * This server provides access to the Breeze Church Management System API,
 * allowing integration with people management, events, contributions, and more.
 *
 * Required environment variables:
 * - BREEZE_SUBDOMAIN: Your Breeze subdomain (e.g., "mychurch" for mychurch.breezechms.com)
 * - BREEZE_API_KEY: Your Breeze API key (from Extensions > API page)
 */

class BreezeChMSServer {
  private server: Server;
  private subdomain: string;
  private apiKey: string;
  private baseUrl: string;
  private debug: boolean;
  private apiClient: AxiosInstance;

  constructor() {
    this.server = new Server(
      {
        name: "breeze-chms-server",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    // Get configuration from environment variables
    this.subdomain = process.env.BREEZE_SUBDOMAIN || "";
    this.apiKey = process.env.BREEZE_API_KEY || "";
    this.baseUrl = `https://${this.subdomain}.breezechms.com/api`;
    this.debug = (process.env.BREEZE_DEBUG === "1") || ((process.env.DEBUG?.toLowerCase()?.includes("breeze")) ?? false);
    this.apiClient = axios.create({
      baseURL: this.baseUrl.endsWith('/') ? this.baseUrl : `${this.baseUrl}/`,
      headers: { 'Api-Key': this.apiKey },
      timeout: 30000,
    });

    if (!this.subdomain || !this.apiKey) {
      console.error("BREEZE_SUBDOMAIN and BREEZE_API_KEY environment variables are required");
      process.exit(1);
    }

    if (this.debug) {
      console.error(`[Breeze] Initialized with baseUrl=${this.apiClient.defaults.baseURL} subdomain=${this.subdomain}`);
    }

    this.setupToolHandlers();
  }

  private maskApiKey(key: string): string {
    if (!key) return "<missing>";
    const last4 = key.slice(-4);
    return `***${last4}`;
  }

  private getSystemPrompt(): string {
    return `# Comprehensive Breeze ChMS API System Prompt

## Core Understanding

You are a Breeze ChMS API specialist with access to a Breeze Church Management System database. This system manages church membership, events, contributions, and more. Understanding API limitations and best practices is crucial for successful operations.

## Critical Search Limitations

### **Name Searches Don't Work with Simple Strings**
- ❌ **WRONG**: \`{"name": "John Smith"}\`, \`{"first_name": "John"}\`, \`{"last": "Smith"}\`
- The API does **NOT** support simple text searches in \`filter_json\`
- You cannot search by name directly without field IDs

### **Person Not Found Scenarios**
When someone cannot be found, consider:
- **Alternate spellings**: Joshua vs Josh, MacDonald vs McDonald
- **Name changes**: Marriage, legal changes, preferred names
- **Multiple entries**: Duplicate records with slight variations
- **Status changes**: "No Longer Attends", archived, or inactive members
- **Family listings**: Person listed under spouse's or family name
- **Nickname usage**: "Mike" instead of "Michael", "Beth" instead of "Elizabeth"

## Effective Search Strategies

### **Method 1: Profile Field Discovery (Most Accurate)**
\`\`\`javascript
// Step 1: Get all profile fields with their IDs
breeze-chms:list_profile_fields()

// Step 2: Use discovered field IDs for precise searches
filter_json: {"field_id_123456": "John"}
\`\`\`

### **Method 2: Tag-Based Search (Most Reliable)**
\`\`\`javascript
// Step 1: List available tags
breeze-chms:list_tags()

// Step 2: Search by tag
filter_json: {"tag_contains": "volunteer_team"}
\`\`\`

### **Method 3: Pagination Strategy (Only Reliable Name-Search Method)**
\`\`\`javascript
// list_people returns results alphabetically by last name.
// Name-based filter_json keys (search_name, name_contains, first_name, last, etc.)
// return false — name search via filter_json is NOT supported.
// The only way to find someone by name is to paginate and scan manually.
breeze-chms:list_people({
  "details": 0,   // use 0 (names + IDs only) for fast scanning
  "limit": 200,
  "offset": 0
})
// Continue with offset: 200, 400, 600... until response is an empty array.
\`\`\`

### **Method 4: Tag-Based Filter**
\`\`\`javascript
// Filter by tag ID (use the numeric tag ID string, not the tag name)
filter_json: {"tag_contains": "4550024"}
// Returns [] (empty array) when no matches — not false.
\`\`\`\`

## Data Migration Best Practices

### **Pre-Migration Assessment**

1. **Inventory Current Data**
   \`\`\`javascript
   // Get complete member count
   breeze-chms:list_people({"details": 0, "limit": 1})

   // Analyze data structure
   breeze-chms:list_profile_fields()

   // Check existing tags and organization
   breeze-chms:list_tags()
   \`\`\`

2. **Identify Data Quality Issues**
   - Duplicate entries (same person multiple times)
   - Incomplete records (missing emails, phones)
   - Inconsistent data (address formats, phone formats)
   - Outdated information (old addresses, disconnected phones)

3. **Plan Data Mapping**
   - Map source system fields to Breeze field IDs
   - Define data transformation rules
   - Identify required vs optional fields
   - Plan family relationship structures

### **Migration Execution Strategies**

#### **Bulk Export for Analysis**
\`\`\`javascript
// Export all people in batches
let allPeople = [];
let offset = 0;
const batchSize = 100;

// Continue until no more records
while (true) {
  const batch = breeze-chms:list_people({
    "details": 1,
    "limit": batchSize,
    "offset": offset
  });

  if (batch.length === 0) break;
  allPeople = allPeople.concat(batch);
  offset += batchSize;
}
\`\`\`

#### **Family Structure Migration**
\`\`\`javascript
// Approach 1: Create individuals first, then families
// 1. Create all individual people
// 2. Use breeze-chms:create_family to group them
// 3. Use breeze-chms:add_to_family for complex relationships

// Approach 2: Create family heads first
// 1. Identify family heads in source data
// 2. Create head of household records
// 3. Add spouses and children to existing families
\`\`\`

#### **Data Validation During Migration**
\`\`\`javascript
// IMPORTANT: add_person only reliably saves multiple_choice (and similar simple) fields.
// Contact fields (phone, email, address) must be set via a follow-up update_person call.

// Step 1: Create with profile/status fields
const newPerson = breeze-chms:add_person({
  "first": "John",
  "last": "Smith",
  "fields_json": JSON.stringify([
    {"field_id": "218827608", "field_type": "multiple_choice", "response": "32"}
  ])
});

// Step 2: Set contact fields separately
if (newPerson.id) {
  breeze-chms:update_person({
    "person_id": newPerson.id,
    "fields_json": JSON.stringify([
      {"field_id": "1179914680", "field_type": "email_primary",  "response": "john@example.com"},
      {"field_id": "984378195",  "field_type": "phone_mobile",   "response": "(555) 123-4567"},
      {"field_id": "1279661039", "field_type": "address", "response": true, "details": {"street_address": "123 Main St", "city": "City", "state": "GA", "zip": "30000"}}
    ])
  });
}
\`\`\`

### **Data Cleanup Operations**

#### **Duplicate Detection and Merging**
\`\`\`javascript
// Strategy: Group by similar names and addresses
// 1. Export all people with full details
// 2. Group by last_name + first_name (fuzzy matching)
// 3. Compare addresses, phones, emails for duplicates
// 4. Manual review for merge decisions
// 5. Use update operations to consolidate data
// 6. Delete duplicate records after verification
\`\`\`

#### **Standardization Operations**
\`\`\`javascript
// Phone number standardization
// Update to consistent format: (770) 555-1234
const standardizePhone = (phone) => {
  // Remove all non-digits, format consistently
  const digits = phone.replace(/\\D/g, '');
  return digits.length === 10 ?
    \`(\${digits.slice(0,3)}) \${digits.slice(3,6)}-\${digits.slice(6)}\` :
    phone;
};

// Address standardization
// Consistent abbreviations: St., Ave., Dr., etc.
// Proper capitalization and formatting
\`\`\`

## Event Management

### **Event Series and Recurring Events**
\`\`\`javascript
// Create event series
const parentEvent = breeze-chms:add_event({
  "name": "Weekly Bible Study",
  "starts_on": "2024-01-07 19:00:00",
  "category_id": "123"
});

// Note: Breeze handles recurrence through UI, not API
// API creates individual instances
\`\`\`

### **Attendance Tracking**
\`\`\`javascript
// Check someone into an event
breeze-chms:checkin_person({
  "person_id": "12345",
  "instance_id": "67890",
  "direction": "in"
});

// Get attendance reports
breeze-chms:get_event_attendance({
  "instance_id": "67890",
  "details": true,
  "type": "person"
});
\`\`\`

### **Volunteer Management**
\`\`\`javascript
// Schedule volunteers for events
breeze-chms:schedule_volunteer({
  "instance_id": "67890",
  "person_id": "12345"
});

// List volunteer roles
breeze-chms:list_volunteers({
  "instance_id": "67890"
});
\`\`\`

## Contribution Management

### **Recording Donations**
\`\`\`javascript
breeze-chms:add_contribution({
  "date": "2024-01-15",
  "person_json": JSON.stringify({
    "name": "John Smith",
    "email": "john@email.com"
  }),
  "method": "Check",
  "funds_json": JSON.stringify([
    {"name": "General Fund", "amount": 100.00},
    {"name": "Missions", "amount": 25.00}
  ]),
  "amount": 125.00,
  "batch_name": "Sunday Collection"
});
\`\`\`

### **Batch Processing Contributions**
\`\`\`javascript
// Use consistent group and batch_name for related contributions
const group = \`batch_\${Date.now()}\`;
const batch_name = "Annual Giving Import";

// Process each contribution with same group/batch
contributions.forEach(contrib => {
  breeze-chms:add_contribution({
    ...contrib,
    "group": group,
    "batch_name": batch_name
  });
});
\`\`\`

## Advanced Data Operations

### **Tag Management Strategy**
\`\`\`javascript
// Create organized tag structure
// 1. Create tag folders for organization
breeze-chms:add_tag_folder({"name": "Ministries"});
breeze-chms:add_tag_folder({"name": "Life Stages"});
breeze-chms:add_tag_folder({"name": "Skills"});

// 2. Create specific tags within folders
breeze-chms:add_tag({
  "name": "Worship Team",
  "folder_id": "ministries_folder_id"
});

// 3. Assign tags systematically
breeze-chms:assign_tag({
  "person_id": "12345",
  "tag_id": "worship_team_tag_id"
});
\`\`\`

### **fields_json Format Reference (Verified)**

The \`fields_json\` parameter for \`add_person\` and \`update_person\` is a **JSON array** of field objects:
\`\`\`json
[{"field_id": "FIELD_ID", "field_type": "TYPE", "response": "VALUE"}, ...]
\`\`\`

**Confirmed working field_type names and response formats:**

| field_type | response | details | Notes |
|---|---|---|---|
| \`multiple_choice\` | \`"OPTION_ID"\` (string) | — | The numeric option_id from list_profile_fields |
| \`email_primary\` | \`"user@example.com"\` | — | Plain string shorthand (verified working) |
| \`phone_mobile\` | \`"(555) 123-4567"\` | — | Plain string shorthand (verified working) |
| \`address\` | \`true\` | \`{"street_address":"...","city":"...","state":"...","zip":"..."}\` | **Must use details object** — flat string breaks frontend |

**Address format (REQUIRED — flat string causes broken display "1, 1 1"):**
\`\`\`json
{"field_id": "FIELD_ID", "field_type": "address", "response": true, "details": {"street_address": "123 Main St", "city": "Dallas", "state": "GA", "zip": "30132"}}
\`\`\`

**Alternative official formats (from Breeze API docs) that also work:**
- Email: \`{"field_type": "email", "response": true, "details": {"address": "user@example.com"}}\`
- Phone mobile: \`{"field_type": "phone", "response": true, "details": {"phone_mobile": "111-111-1111"}}\`
- Phone home: \`{"field_type": "phone", "response": true, "details": {"phone_home": "222-222-2222"}}\`

**Critical: do NOT use these — they are silently ignored:**
- \`"field_type": "email"\` with a plain string response (no details object) → ignored
- \`"field_type": "phone"\` with a plain string response (no details object) → ignored
- \`"field_type": "address_primary"\` with a plain string response → **saves but renders broken on frontend**
- Array responses: \`{"response": [{"address": "..."}]}\` → ignored

**Critical: \`add_person\` only saves simple fields (e.g. multiple_choice).** Phone, email, and
address must be set via a separate \`update_person\` call — they are silently ignored in \`add_person\`.

### **Profile Field Analysis**
\`\`\`javascript
// Get all profile fields to understand data structure
const fields = breeze-chms:list_profile_fields();

// Analyze field types and usage
fields.forEach(section => {
  console.log(\`Section: \${section.name}\`);
  section.fields.forEach(field => {
    console.log(\`  Field: \${field.name} (ID: \${field.field_id})\`);
    console.log(\`  Type: \${field.field_type}\`);
    if (field.options) {
      console.log(\`  Options: \${JSON.stringify(field.options)}\`);
    }
  });
});
\`\`\`

### **Form and Survey Data**
\`\`\`javascript
// List all forms
breeze-chms:list_forms({"is_archived": 0});

// Get form responses
breeze-chms:list_form_entries({"form_id": "123"});

// Analyze form data for insights
// Use for contact preferences, ministry interests, etc.
\`\`\`

## Error Handling and Recovery

### **Common Error Patterns**
\`\`\`javascript
// 1. Rate limiting - implement delays between calls
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// 2. Required field validation
try {
  const result = breeze-chms:add_person(personData);
} catch (error) {
  console.log("Missing required fields:", error.message);
  // Check profile fields for requirements
}

// 3. Duplicate prevention
// Always check if person exists before creating
const existing = searchForExistingPerson(firstName, lastName);
if (!existing) {
  createNewPerson(personData);
}
\`\`\`

### **Data Integrity Checks**
\`\`\`javascript
// Verify family relationships
const family = person.family;
if (family.length > 0) {
  // Confirm all family members exist
  family.forEach(member => {
    const memberExists = breeze-chms:get_person({
      "person_id": member.person_id
    });
    if (!memberExists) {
      console.log(\`Broken family link: \${member.person_id}\`);
    }
  });
}

// Verify contact information
if (person.details["1179914680"]) { // Email field
  const emails = person.details["1179914680"];
  emails.forEach(email => {
    if (!isValidEmail(email.address)) {
      console.log(\`Invalid email: \${email.address}\`);
    }
  });
}
\`\`\`

## Best Practices for Large Operations

### **Performance Optimization**
- Use pagination with reasonable limits (50-100 records)
- Implement delays between API calls to avoid rate limits
- Cache profile field mappings to avoid repeated calls
- Use batch operations where possible

### **Data Consistency**
- Always verify data after creation/updates
- Maintain logs of all operations for audit trails
- Use transactions conceptually (group related operations)
- Implement rollback procedures for failed operations

### **Security Considerations**
- Never log sensitive data (emails, phones, addresses)
- Implement proper access controls for migration scripts
- Use environment variables for API credentials
- Audit data access and modifications

## Troubleshooting Guide

### **Person Not Found Issues**
1. Try alternate name spellings
2. Search by partial names
3. Check different status categories
4. Look in family member lists
5. Search by contact information
6. Check archived/inactive records

### **Data Import Failures**
1. Validate required fields before import
2. Check field ID mappings
3. Verify data format compatibility
4. Test with small batches first
5. Implement detailed error logging

### **Performance Problems**
1. Reduce batch sizes
2. Implement progressive delays
3. Use more specific filters
4. Avoid unnecessary field retrievals
5. Cache repeated lookups

Remember: The Breeze API is designed for structured data management, not free-text searching. Always work with the API's strengths and implement workarounds for its limitations.`;
  }

  private async makeApiRequest(endpoint: string, params: Record<string, any> = {}): Promise<any> {
    try {
      // Normalize endpoint and forward params (API key is sent via header)
      const requestParams = { ...params };
      const normalizedEndpoint = endpoint.replace(/^\/+/, '');

      if (this.debug) {
        // Log without exposing the full API key
        console.error(`[Breeze] Request -> GET ${this.apiClient.defaults.baseURL}${normalizedEndpoint}`);
        console.error(`[Breeze] Headers -> { "Api-Key": "${this.maskApiKey(this.apiKey)}" }`);
        console.error(`[Breeze] Params  -> ${JSON.stringify(requestParams)}`);
      }

      const startedAt = Date.now();
      const response = await this.apiClient.get(normalizedEndpoint, { params: requestParams });
      if (this.debug) {
        const ms = Date.now() - startedAt;
        console.error(`[Breeze] Response <- ${response.status} (${ms}ms) ${this.apiClient.defaults.baseURL}${normalizedEndpoint}`);
      }
      return response.data;
    } catch (error: any) {
      if (this.debug) {
        const status = error?.response?.status;
        const data = error?.response?.data;
        console.error(`[Breeze] Error <- status=${status ?? 'n/a'} message=${error.message}`);
        if (data) {
          try {
            console.error(`[Breeze] Error body: ${typeof data === 'string' ? data : JSON.stringify(data)}`);
          } catch {
            // ignore JSON stringify issues
          }
        }
      }
      throw new Error(`Breeze API request failed: ${error.response?.data?.message || error.message}`);
    }
  }

  private setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          // People Management
          {
            name: "list_people",
            description: "List people in the database with optional filtering",
            inputSchema: {
              type: "object",
              properties: {
                details: {
                  type: "number",
                  description: "1 to get all information, 0 for just names and IDs",
                  enum: [0, 1]
                },
                filter_json: {
                  type: "string",
                  description: "JSON string for filtering (tags, status, etc.)"
                },
                limit: {
                  type: "number",
                  description: "Maximum number of people to return"
                },
                offset: {
                  type: "number",
                  description: "Number of people to skip"
                }
              }
            }
          },
          {
            name: "get_person",
            description: "Get detailed information about a specific person",
            inputSchema: {
              type: "object",
              properties: {
                person_id: {
                  type: "string",
                  description: "The ID of the person to retrieve"
                }
              },
              required: ["person_id"]
            }
          },
          {
            name: "add_person",
            description: "Add a new person to the database",
            inputSchema: {
              type: "object",
              properties: {
                first: {
                  type: "string",
                  description: "First name"
                },
                last: {
                  type: "string",
                  description: "Last name"
                },
                fields_json: {
                  type: "string",
                  description: "JSON string of additional fields to set"
                }
              },
              required: ["first", "last"]
            }
          },
          {
            name: "update_person",
            description: "Update an existing person's information",
            inputSchema: {
              type: "object",
              properties: {
                person_id: {
                  type: "string",
                  description: "ID of person to update"
                },
                fields_json: {
                  type: "string",
                  description: "JSON string of fields to update"
                }
              },
              required: ["person_id", "fields_json"]
            }
          },
          {
            name: "delete_person",
            description: "Delete a person from the database",
            inputSchema: {
              type: "object",
              properties: {
                person_id: {
                  type: "string",
                  description: "ID of person to delete"
                }
              },
              required: ["person_id"]
            }
          },

          // Profile Fields
          {
            name: "list_profile_fields",
            description: "List all profile field sections and their fields",
            inputSchema: {
              type: "object",
              properties: {}
            }
          },

          // Tags Management
          {
            name: "list_tags",
            description: "List all tags and tag folders",
            inputSchema: {
              type: "object",
              properties: {}
            }
          },
          {
            name: "add_tag",
            description: "Create a new tag",
            inputSchema: {
              type: "object",
              properties: {
                name: {
                  type: "string",
                  description: "Name of the new tag"
                },
                folder_id: {
                  type: "string",
                  description: "ID of folder to place tag in"
                }
              },
              required: ["name"]
            }
          },
          {
            name: "add_tag_folder",
            description: "Create a new tag folder",
            inputSchema: {
              type: "object",
              properties: {
                name: {
                  type: "string",
                  description: "Name of the new folder"
                },
                parent_id: {
                  type: "string",
                  description: "ID of parent folder"
                }
              },
              required: ["name"]
            }
          },
          {
            name: "assign_tag",
            description: "Assign a tag to a person",
            inputSchema: {
              type: "object",
              properties: {
                person_id: {
                  type: "string",
                  description: "ID of person"
                },
                tag_id: {
                  type: "string",
                  description: "ID of tag to assign"
                }
              },
              required: ["person_id", "tag_id"]
            }
          },
          {
            name: "unassign_tag",
            description: "Remove a tag from a person",
            inputSchema: {
              type: "object",
              properties: {
                person_id: {
                  type: "string",
                  description: "ID of person"
                },
                tag_id: {
                  type: "string",
                  description: "ID of tag to remove"
                }
              },
              required: ["person_id", "tag_id"]
            }
          },

          // Events Management
          {
            name: "list_events",
            description: "List events within a date range",
            inputSchema: {
              type: "object",
              properties: {
                start: {
                  type: "string",
                  description: "Start date (YYYY-MM-DD)"
                },
                end: {
                  type: "string",
                  description: "End date (YYYY-MM-DD)"
                },
                category_id: {
                  type: "string",
                  description: "Filter by calendar category"
                }
              }
            }
          },
          {
            name: "list_calendars",
            description: "List all event calendars",
            inputSchema: {
              type: "object",
              properties: {}
            }
          },
          {
            name: "get_event",
            description: "Get details about a specific event instance",
            inputSchema: {
              type: "object",
              properties: {
                instance_id: {
                  type: "string",
                  description: "Event instance ID"
                },
                schedule: {
                  type: "boolean",
                  description: "Include other instances in series"
                },
                eligible: {
                  type: "number",
                  description: "Include check-in eligibility details",
                  enum: [0, 1]
                },
                details: {
                  type: "number",
                  description: "Include additional event details",
                  enum: [0, 1]
                }
              },
              required: ["instance_id"]
            }
          },
          {
            name: "add_event",
            description: "Create a new event",
            inputSchema: {
              type: "object",
              properties: {
                name: {
                  type: "string",
                  description: "Event name"
                },
                starts_on: {
                  type: "string",
                  description: "Start timestamp"
                },
                category_id: {
                  type: "string",
                  description: "Calendar category ID"
                }
              },
              required: ["name", "starts_on"]
            }
          },
          {
            name: "delete_event_instance",
            description: "Delete a specific event instance",
            inputSchema: {
              type: "object",
              properties: {
                instance_id: {
                  type: "string",
                  description: "Event instance ID to delete"
                }
              },
              required: ["instance_id"]
            }
          },

          // Event Attendance
          {
            name: "checkin_person",
            description: "Check a person into an event",
            inputSchema: {
              type: "object",
              properties: {
                person_id: {
                  type: "string",
                  description: "Person ID"
                },
                instance_id: {
                  type: "string",
                  description: "Event instance ID"
                },
                direction: {
                  type: "string",
                  description: "Check in or out",
                  enum: ["in", "out"],
                  default: "in"
                }
              },
              required: ["person_id", "instance_id"]
            }
          },
          {
            name: "get_event_attendance",
            description: "Get attendance records for an event",
            inputSchema: {
              type: "object",
              properties: {
                instance_id: {
                  type: "string",
                  description: "Event instance ID"
                },
                details: {
                  type: "boolean",
                  description: "Include person details"
                },
                type: {
                  type: "string",
                  description: "Type of attendance records",
                  enum: ["person", "anonymous"],
                  default: "person"
                }
              },
              required: ["instance_id"]
            }
          },

          // Forms
          {
            name: "list_forms",
            description: "List all forms",
            inputSchema: {
              type: "object",
              properties: {
                is_archived: {
                  type: "number",
                  description: "1 for archived forms, 0 for active",
                  enum: [0, 1]
                }
              }
            }
          },
          {
            name: "list_form_fields",
            description: "List fields for a specific form",
            inputSchema: {
              type: "object",
              properties: {
                form_id: {
                  type: "string",
                  description: "Form ID"
                }
              },
              required: ["form_id"]
            }
          },
          {
            name: "list_form_entries",
            description: "List entries for a specific form",
            inputSchema: {
              type: "object",
              properties: {
                form_id: {
                  type: "string",
                  description: "Form ID"
                }
              },
              required: ["form_id"]
            }
          },

          // Volunteers
          {
            name: "list_volunteers",
            description: "List volunteers for an event instance",
            inputSchema: {
              type: "object",
              properties: {
                instance_id: {
                  type: "string",
                  description: "Event instance ID"
                }
              },
              required: ["instance_id"]
            }
          },
          {
            name: "schedule_volunteer",
            description: "Schedule a volunteer for an event",
            inputSchema: {
              type: "object",
              properties: {
                instance_id: {
                  type: "string",
                  description: "Event instance ID"
                },
                person_id: {
                  type: "string",
                  description: "Person ID"
                }
              },
              required: ["instance_id", "person_id"]
            }
          },
          {
            name: "unschedule_volunteer",
            description: "Remove a volunteer from an event",
            inputSchema: {
              type: "object",
              properties: {
                instance_id: {
                  type: "string",
                  description: "Event instance ID"
                },
                person_id: {
                  type: "string",
                  description: "Person ID"
                }
              },
              required: ["instance_id", "person_id"]
            }
          },

          // Families
          {
            name: "create_family",
            description: "Create a new family with specified people",
            inputSchema: {
              type: "object",
              properties: {
                people_ids_json: {
                  type: "string",
                  description: "JSON array of people IDs to connect"
                }
              },
              required: ["people_ids_json"]
            }
          },
          {
            name: "destroy_family",
            description: "Destroy an existing family",
            inputSchema: {
              type: "object",
              properties: {
                people_ids_json: {
                  type: "string",
                  description: "JSON array with at least one person ID from the family"
                }
              },
              required: ["people_ids_json"]
            }
          },
          {
            name: "add_to_family",
            description: "Add people to an existing family",
            inputSchema: {
              type: "object",
              properties: {
                people_ids_json: {
                  type: "string",
                  description: "JSON array of people IDs to add"
                },
                target_person_id: {
                  type: "string",
                  description: "ID of someone in the target family"
                }
              },
              required: ["people_ids_json", "target_person_id"]
            }
          },
          {
            name: "remove_from_family",
            description: "Remove people from their current families",
            inputSchema: {
              type: "object",
              properties: {
                people_ids_json: {
                  type: "string",
                  description: "JSON array of people IDs to remove"
                }
              },
              required: ["people_ids_json"]
            }
          },

          // Giving/Contributions
          {
            name: "add_contribution",
            description: "Add a contribution/donation record",
            inputSchema: {
              type: "object",
              properties: {
                date: {
                  type: "string",
                  description: "Date of contribution (YYYY-MM-DD)"
                },
                person_json: {
                  type: "string",
                  description: "JSON with person info (name, email, etc.)"
                },
                uid: {
                  type: "string",
                  description: "Unique identifier for the giver"
                },
                processor: {
                  type: "string",
                  description: "Name of payment processor"
                },
                method: {
                  type: "string",
                  description: "Payment method (Check, Cash, etc.)"
                },
                funds_json: {
                  type: "string",
                  description: "JSON array of fund allocations"
                },
                amount: {
                  type: "number",
                  description: "Total contribution amount"
                },
                group: {
                  type: "string",
                  description: "Group identifier for batching"
                },
                batch_name: {
                  type: "string",
                  description: "Name of the batch"
                }
              },
              required: ["date", "person_json", "method", "funds_json", "amount"]
            }
          },

          // Activity Log
          {
            name: "list_activity",
            description: "List activity log entries",
            inputSchema: {
              type: "object",
              properties: {
                action: {
                  type: "string",
                  description: "Type of action to filter by"
                },
                start: {
                  type: "string",
                  description: "Start date (YYYY-MM-DD)"
                },
                end: {
                  type: "string",
                  description: "End date (YYYY-MM-DD)"
                },
                user_id: {
                  type: "string",
                  description: "Filter by user ID"
                },
                details: {
                  type: "number",
                  description: "Include details (1) or not (0)",
                  enum: [0, 1]
                },
                limit: {
                  type: "number",
                  description: "Maximum number of items to return (max 3000)",
                  maximum: 3000
                }
              },
              required: ["action"]
            }
          },

          // System Prompt
          {
            name: "system-prompt",
            description: "Get the comprehensive Breeze ChMS API system prompt with best practices, limitations, and troubleshooting guidance",
            inputSchema: {
              type: "object",
              properties: {}
            }
          }
        ] as Tool[]
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name } = request.params;
      const args = request.params.arguments ?? {};

      try {
        let result: any;

        switch (name) {
          // People Management
          case "list_people":
            result = await this.makeApiRequest("/people", args);
            break;

          case "get_person":
            if (!args || !args.person_id) {
              throw new Error("get_person requires argument 'person_id'");
            }
            result = await this.makeApiRequest(`/people/${args.person_id}`);
            break;

          case "add_person":
            result = await this.makeApiRequest("/people/add", args);
            break;

          case "update_person":
            result = await this.makeApiRequest("/people/update", args);
            break;

          case "delete_person":
            result = await this.makeApiRequest("/people/delete", args);
            break;

          // Profile Fields
          case "list_profile_fields":
            result = await this.makeApiRequest("/profile");
            break;

          // Tags
          case "list_tags":
            result = await this.makeApiRequest("/tags/list_tags");
            break;

          case "add_tag":
            result = await this.makeApiRequest("/tags/add_tag", args);
            break;

          case "add_tag_folder":
            result = await this.makeApiRequest("/tags/add_folder", args);
            break;

          case "assign_tag":
            result = await this.makeApiRequest("/tags/assign", args);
            break;

          case "unassign_tag":
            result = await this.makeApiRequest("/tags/unassign", args);
            break;

          // Events
          case "list_events":
            result = await this.makeApiRequest("/events", args);
            break;

          case "get_event":
            result = await this.makeApiRequest("/events/list_event", args);
            break;

          case "add_event":
            result = await this.makeApiRequest("/events/add", args);
            break;

          case "delete_event_instance":
            result = await this.makeApiRequest("/events/delete_instance", args);
            break;

          case "list_calendars":
            result = await this.makeApiRequest("/events/calendars/list");
            break;

          // Event Attendance
          case "checkin_person":
            result = await this.makeApiRequest("/events/attendance/add", args);
            break;

          case "get_event_attendance":
            result = await this.makeApiRequest("/events/attendance/list", args);
            break;

          // Forms
          case "list_forms":
            result = await this.makeApiRequest("/forms", args);
            break;

          case "list_form_fields":
            result = await this.makeApiRequest("/forms/list_fields", args);
            break;

          case "list_form_entries":
            result = await this.makeApiRequest("/forms/list_entries", args);
            break;

          // Volunteers
          case "list_volunteers":
            result = await this.makeApiRequest("/volunteers/list", args);
            break;

          case "schedule_volunteer":
            result = await this.makeApiRequest("/volunteers/add", args);
            break;

          case "unschedule_volunteer":
            result = await this.makeApiRequest("/volunteers/remove", args);
            break;

          // Families
          case "create_family":
            result = await this.makeApiRequest("/families/create", args);
            break;

          case "destroy_family":
            result = await this.makeApiRequest("/families/destroy", args);
            break;

          case "add_to_family":
            result = await this.makeApiRequest("/families/add", args);
            break;

          case "remove_from_family":
            result = await this.makeApiRequest("/families/remove", args);
            break;

          // Giving
          case "add_contribution":
            result = await this.makeApiRequest("/giving/add", args);
            break;

          // Activity Log
          case "list_activity":
            result = await this.makeApiRequest("/activity", args);
            break;

          // System Prompt
          case "system-prompt":
            result = this.getSystemPrompt();
            break;

          default:
            throw new Error(`Unknown tool: ${name}`);
        }

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2)
            }
          ]
        };

      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error: ${error instanceof Error ? error.message : String(error)}`
            }
          ],
          isError: true
        };
      }
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("Breeze ChMS MCP server running on stdio");
  }
}

const server = new BreezeChMSServer();
server.run().catch(console.error);
