// TypeScript type definitions for Breeze ChMS API

export interface Person {
  id: string;
  first_name: string;
  last_name: string;
  path: string;
  details?: PersonDetails;
}

export interface PersonDetails {
  [fieldId: string]: FieldValue;
}

export interface FieldValue {
  field_id: string;
  field_type: string;
  name: string;
  value: any;
  details?: any;
}

export interface ProfileField {
  field_id: string;
  name: string;
  field_type: string;
  position: number;
  profile_section_id: string;
  options?: FieldOption[];
  details?: any;
}

export interface FieldOption {
  id: string;
  name: string;
  position: number;
}

export interface ProfileSection {
  id: string;
  name: string;
  position: number;
  fields: ProfileField[];
}

export interface Tag {
  id: string;
  name: string;
  created_on: string;
  folder_id?: string;
}

export interface TagFolder {
  id: string;
  name: string;
  parent_id?: string;
}

export interface Event {
  id: string;
  name: string;
  category_id: string;
  start_datetime: string;
  end_datetime: string;
  created_on: string;
  instance_id?: string;
}

export interface EventInstance {
  id: string;
  oid: string;
  event_id: string;
  name: string;
  category_id: string;
  settings_id: string;
  start_datetime: string;
  end_datetime: string;
  is_modified: string;
  created_on: string;
}

export interface Calendar {
  id: string;
  name: string;
  color: string;
  address: string;
  embed_key: string;
  created_on?: string;
}

export interface AttendanceRecord {
  id: string;
  person_id: string;
  instance_id: string;
  checked_in: string;
  checked_out?: string;
  person?: Person;
}

export interface Form {
  id: string;
  name: string;
  created_on: string;
  is_archived: boolean;
}

export interface FormField {
  id: string;
  name: string;
  field_type: string;
  position: number;
  required: boolean;
  options?: FieldOption[];
}

export interface FormEntry {
  id: string;
  form_id: string;
  person_id?: string;
  created_on: string;
  details: { [fieldId: string]: any };
}

export interface Volunteer {
  id: string;
  person_id: string;
  instance_id: string;
  person?: Person;
  roles?: VolunteerRole[];
}

export interface VolunteerRole {
  id: string;
  name: string;
  quantity?: number;
}

export interface Family {
  id: string;
  members: Person[];
}

export interface Contribution {
  id: string;
  person_id?: string;
  date: string;
  amount: number;
  method: string;
  processor?: string;
  batch_id?: string;
  funds: ContributionFund[];
}

export interface ContributionFund {
  id: string;
  name: string;
  amount: number;
}

export interface ActivityLogEntry {
  id: string;
  action: string;
  user_id: string;
  created_on: string;
  details?: string;
  user?: {
    id: string;
    name: string;
  };
}

export interface BreezeApiError {
  message: string;
  code?: string;
  details?: any;
}

// API Request/Response types
export interface ListPeopleRequest {
  details?: 0 | 1;
  filter_json?: string;
  limit?: number;
  offset?: number;
}

export interface AddPersonRequest {
  first: string;
  last: string;
  fields_json?: string;
}

export interface UpdatePersonRequest {
  person_id: string;
  fields_json: string;
}

export interface ListEventsRequest {
  start?: string;
  end?: string;
  category_id?: string;
}

export interface AddEventRequest {
  name: string;
  starts_on: string;
  category_id?: string;
}

export interface CheckinRequest {
  person_id: string;
  instance_id: string;
  direction?: 'in' | 'out';
}

export interface AddContributionRequest {
  date: string;
  person_json: string;
  uid?: string;
  processor?: string;
  method: string;
  funds_json: string;
  amount: number;
  group?: string;
  batch_name?: string;
}

export interface ListActivityRequest {
  action: string;
  start?: string;
  end?: string;
  user_id?: string;
  details?: 0 | 1;
  limit?: number;
}

// Field update structures for different field types
export interface TextField {
  field_id: string;
  field_type: 'text';
  response: string;
}

export interface EmailField {
  field_id: string;
  field_type: 'email';
  response: boolean;
  details: {
    address: string;
  };
}

export interface PhoneField {
  field_id: string;
  field_type: 'phone';
  response: boolean;
  details: {
    phone_mobile?: string;
    phone_home?: string;
    phone_work?: string;
  };
}

export interface AddressField {
  field_id: string;
  field_type: 'address';
  response: boolean;
  details: {
    street_address: string;
    city: string;
    state: string;
    zip: string;
  };
}

export interface DateField {
  field_id: string;
  field_type: 'date' | 'birthdate';
  response: string; // MM/DD/YYYY format
}

export interface RadioField {
  field_id: string;
  field_type: 'radio';
  response: string; // option ID
}

export interface CheckboxField {
  field_id: string;
  field_type: 'checkbox';
  response: string; // option ID
}

export interface FamilyRoleField {
  field_id: string;
  field_type: 'family_role';
  response: 'undefined';
  details: {
    person_id: string;
    role_id: 1 | 2 | 3 | 4 | 5; // 1=Unassigned, 2=Child, 3=Adult, 4=Head of Household, 5=Spouse
  };
}

export type FieldUpdate = 
  | TextField 
  | EmailField 
  | PhoneField 
  | AddressField 
  | DateField 
  | RadioField 
  | CheckboxField 
  | FamilyRoleField;
