export type ContactType = "phone" | "whatsapp" | "linkedin";

export interface Contact {
  id: string;
  userId: string;
  contactType: ContactType;
  contactDetail: string;
  createdAt: string;
  updatedAt: string;
}

export interface AddContactPayload {
  contactType: ContactType;
  contactDetail: string;
}

export interface UpdateContactPayload {
  contactType?: ContactType;
  contactDetail?: string;
}
