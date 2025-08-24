#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
import axios, { AxiosRequestConfig } from "axios";

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

    if (!this.subdomain || !this.apiKey) {
      console.error("BREEZE_SUBDOMAIN and BREEZE_API_KEY environment variables are required");
      process.exit(1);
    }

    this.setupToolHandlers();
  }

  private async makeApiRequest(endpoint: string, params: Record<string, any> = {}): Promise<any> {
    try {
      // Add API key to params
      const requestParams = { ...params, api_key: this.apiKey };
      
      const config: AxiosRequestConfig = {
        url: `${this.baseUrl}${endpoint}`,
        method: 'GET',
        params: requestParams,
        timeout: 30000,
      };

      const response = await axios(config);
      return response.data;
    } catch (error: any) {
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
                  description: "The ID of the person to retrieve",
                  required: true
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
                  description: "First name",
                  required: true
                },
                last: {
                  type: "string", 
                  description: "Last name",
                  required: true
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
                  description: "ID of person to update",
                  required: true
                },
                fields_json: {
                  type: "string",
                  description: "JSON string of fields to update",
                  required: true
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
                  description: "ID of person to delete",
                  required: true
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
                  description: "Name of the new tag",
                  required: true
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
                  description: "Name of the new folder",
                  required: true
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
                  description: "ID of person",
                  required: true
                },
                tag_id: {
                  type: "string",
                  description: "ID of tag to assign",
                  required: true
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
                  description: "ID of person",
                  required: true
                },
                tag_id: {
                  type: "string",
                  description: "ID of tag to remove",
                  required: true
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
            name: "get_event",
            description: "Get details about a specific event instance",
            inputSchema: {
              type: "object",
              properties: {
                instance_id: {
                  type: "string",
                  description: "Event instance ID",
                  required: true
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
                  description: "Event name",
                  required: true
                },
                starts_on: {
                  type: "string",
                  description: "Start timestamp",
                  required: true
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
                  description: "Event instance ID to delete",
                  required: true
                }
              },
              required: ["instance_id"]
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

          // Event Attendance
          {
            name: "checkin_person",
            description: "Check a person into an event",
            inputSchema: {
              type: "object",
              properties: {
                person_id: {
                  type: "string",
                  description: "Person ID",
                  required: true
                },
                instance_id: {
                  type: "string",
                  description: "Event instance ID",
                  required: true
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
                  description: "Event instance ID",
                  required: true
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
                  description: "Form ID",
                  required: true
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
                  description: "Form ID",
                  required: true
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
                  description: "Event instance ID",
                  required: true
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
                  description: "Event instance ID",
                  required: true
                },
                person_id: {
                  type: "string",
                  description: "Person ID",
                  required: true
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
                  description: "Event instance ID",
                  required: true
                },
                person_id: {
                  type: "string",
                  description: "Person ID",
                  required: true
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
                  description: "JSON array of people IDs to connect",
                  required: true
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
                  description: "JSON array with at least one person ID from the family",
                  required: true
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
                  description: "JSON array of people IDs to add",
                  required: true
                },
                target_person_id: {
                  type: "string",
                  description: "ID of someone in the target family",
                  required: true
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
                  description: "JSON array of people IDs to remove",
                  required: true
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
                  description: "Date of contribution (YYYY-MM-DD)",
                  required: true
                },
                person_json: {
                  type: "string",
                  description: "JSON with person info (name, email, etc.)",
                  required: true
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
                  description: "Payment method (Check, Cash, etc.)",
                  required: true
                },
                funds_json: {
                  type: "string",
                  description: "JSON array of fund allocations",
                  required: true
                },
                amount: {
                  type: "number",
                  description: "Total contribution amount",
                  required: true
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
                  description: "Type of action to filter by",
                  required: true
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
          }
        ] as Tool[]
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        let result: any;
        
        switch (name) {
          // People Management
          case "list_people":
            result = await this.makeApiRequest("/people", args);
            break;
          
          case "get_person":
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
