"use client";

import { useState, useEffect } from "react";
import axios from "axios";

export interface ContactInfo {
  email: string;
  phone: string;
  whatsapp: string;
  address: string;
  businessHours: string;
  socialLinks: {
    instagram?: string;
    facebook?: string;
    twitter?: string;
    youtube?: string;
    whatsapp?: string;
  };
  mapEmbedUrl?: string;
}

let cachedContact: ContactInfo | null = null;
let fetchPromise: Promise<ContactInfo | null> | null = null;

function fetchContact(): Promise<ContactInfo | null> {
  if (!fetchPromise) {
    fetchPromise = axios
      .get("/api/site-config?key=contact")
      .then((res) => {
        const value = res.data?.data?.value;
        if (value) {
          cachedContact = value as ContactInfo;
          return cachedContact;
        }
        return null;
      })
      .catch(() => null);
  }
  return fetchPromise;
}

export function useContactInfo() {
  const [contact, setContact] = useState<ContactInfo | null>(cachedContact);
  const [loading, setLoading] = useState(!cachedContact);

  useEffect(() => {
    if (cachedContact) {
      setContact(cachedContact);
      setLoading(false);
      return;
    }

    fetchContact().then((data) => {
      if (data) setContact(data);
      setLoading(false);
    });
  }, []);

  return { contact, loading };
}
