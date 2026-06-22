import React, { createContext, useContext, useState, useEffect } from 'react';
import { db, isConfigured } from '@/services/firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc,
  onSnapshot
} from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';
import { scheduleInvoiceReminder, cancelInvoiceReminders } from '@/utils/notifications';
import { announceInvoiceReminder } from '@/utils/voiceReminder';

export interface Client {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
  tags?: string[];
}

export interface Product {
  id: string;
  name: string;
  price: number;
  taxRate: number; // percentage
  unit?: string;
}

export interface InvoiceItem {
  description: string;
  qty: number;
  rate: number;
  taxRate: number; // percentage
  amount: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  clientId: string;
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  discount: number;
  lateFee: number;
  total: number;
  currency: string;
  status: 'Draft' | 'Sent' | 'Paid' | 'Partially Paid' | 'Overdue';
  dueDate: string; // YYYY-MM-DD
  createdAt: string;
  templateId: 'classic' | 'modern' | 'minimal';
  notes?: string;
}

export interface Estimate {
  id: string;
  estimateNumber: string;
  clientId: string;
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  currency: string;
  status: 'Draft' | 'Sent' | 'Accepted' | 'Declined' | 'Converted';
  validUntil: string; // YYYY-MM-DD
  createdAt: string;
  templateId: 'classic' | 'modern' | 'minimal';
  notes?: string;
}

export interface Payment {
  id: string;
  invoiceId: string;
  amount: number;
  method: 'cash' | 'bank' | 'cheque' | 'other';
  date: string;
  reference?: string;
}

export interface BusinessProfile {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  taxId?: string;
  logoUrl?: string;
  currency: string;
  defaultTaxRate?: number;
  defaultTemplate?: 'classic' | 'modern' | 'minimal';
  reminderDaysBefore?: number;
  reminderRepeatOnOverdue?: boolean;
  voiceRemindersEnabled?: boolean;
}

interface DataContextType {
  clients: Client[];
  products: Product[];
  invoices: Invoice[];
  estimates: Estimate[];
  payments: Payment[];
  businessProfile: BusinessProfile | null;
  saveClient: (client: Omit<Client, 'id'> & { id?: string }) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;
  saveProduct: (product: Omit<Product, 'id'> & { id?: string }) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  saveInvoice: (invoice: Omit<Invoice, 'id'> & { id?: string }) => Promise<void>;
  deleteInvoice: (id: string) => Promise<void>;
  saveEstimate: (estimate: Omit<Estimate, 'id'> & { id?: string }) => Promise<void>;
  deleteEstimate: (id: string) => Promise<void>;
  convertToInvoice: (estimateId: string) => Promise<void>;
  savePayment: (payment: Omit<Payment, 'id'> & { id?: string }) => Promise<void>;
  deletePayment: (id: string) => Promise<void>;
  saveBusinessProfile: (profile: BusinessProfile) => Promise<void>;
  themeMode: 'light' | 'dark' | 'system';
  saveThemeMode: (mode: 'light' | 'dark' | 'system') => Promise<void>;
  isLoading: boolean;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoading: authLoading } = useAuth();
  
  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [estimates, setEstimates] = useState<Estimate[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [businessProfile, setBusinessProfile] = useState<BusinessProfile | null>(null);
  const [themeMode, setThemeModeState] = useState<'light' | 'dark' | 'system'>('system');
  const [isLoading, setIsLoading] = useState(true);

  const getNamespacedKey = (key: string) => {
    return user ? `${key}_${user.uid}` : `${key}_guest`;
  };

  // Load global theme setting on mount
  useEffect(() => {
    async function loadTheme() {
      try {
        const themeVal = await AsyncStorage.getItem('@invonest_theme');
        if (themeVal) {
          setThemeModeState(themeVal as 'light' | 'dark' | 'system');
        }
      } catch (err) {
        console.error('Error loading theme:', err);
      }
    }
    loadTheme();
  }, []);

  // Load user data namespaced by UID, with optional legacy migration
  useEffect(() => {
    if (authLoading) return;

    async function loadLocalData() {
      setIsLoading(true);
      try {
        if (!user) {
          // No user logged in, clear active data state
          setClients([]);
          setProducts([]);
          setInvoices([]);
          setEstimates([]);
          setPayments([]);
          setBusinessProfile(null);
          return;
        }

        const uid = user.uid;

        // Perform legacy data migration to namespaced keys if needed (one-time check)
        const migrationCheckKey = `@invonest_migrated_to_${uid}`;
        const alreadyMigrated = await AsyncStorage.getItem(migrationCheckKey);

        if (!alreadyMigrated) {
          const keysToMigrate = [
            { oldKey: '@invonest_clients', newKey: `@invonest_clients_${uid}` },
            { oldKey: '@invonest_products', newKey: `@invonest_products_${uid}` },
            { oldKey: '@invonest_invoices', newKey: `@invonest_invoices_${uid}` },
            { oldKey: '@invonest_estimates', newKey: `@invonest_estimates_${uid}` },
            { oldKey: '@invonest_payments', newKey: `@invonest_payments_${uid}` },
            { oldKey: '@invonest_profile', newKey: `@invonest_profile_${uid}` },
          ];

          for (const { oldKey, newKey } of keysToMigrate) {
            const oldValue = await AsyncStorage.getItem(oldKey);
            if (oldValue) {
              await AsyncStorage.setItem(newKey, oldValue);
              await AsyncStorage.removeItem(oldKey);
            }
          }
          await AsyncStorage.setItem(migrationCheckKey, 'true');
        }

        // Load namespaced data
        const cVal = await AsyncStorage.getItem(`@invonest_clients_${uid}`);
        const pVal = await AsyncStorage.getItem(`@invonest_products_${uid}`);
        const iVal = await AsyncStorage.getItem(`@invonest_invoices_${uid}`);
        const eVal = await AsyncStorage.getItem(`@invonest_estimates_${uid}`);
        const payVal = await AsyncStorage.getItem(`@invonest_payments_${uid}`);
        const profVal = await AsyncStorage.getItem(`@invonest_profile_${uid}`);

        if (cVal) setClients(JSON.parse(cVal).filter((c: any) => c && c.id));
        else setClients([]);

        if (pVal) setProducts(JSON.parse(pVal).filter((p: any) => p && p.id));
        else setProducts([]);

        if (iVal) setInvoices(JSON.parse(iVal).filter((i: any) => i && i.id));
        else setInvoices([]);

        if (eVal) setEstimates(JSON.parse(eVal).filter((e: any) => e && e.id));
        else setEstimates([]);

        if (payVal) setPayments(JSON.parse(payVal).filter((p: any) => p && p.id));
        else setPayments([]);

        if (profVal) {
          setBusinessProfile(JSON.parse(profVal));
        } else {
          // Initialize default business profile for this user
          const defaultProf: BusinessProfile = {
            name: 'My Business',
            currency: 'USD',
            defaultTaxRate: 0,
            defaultTemplate: 'classic',
            reminderDaysBefore: 3,
            reminderRepeatOnOverdue: true,
            voiceRemindersEnabled: false
          };
          setBusinessProfile(defaultProf);
          await AsyncStorage.setItem(`@invonest_profile_${uid}`, JSON.stringify(defaultProf));
        }
      } catch (err) {
        console.error('Error loading offline cache:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadLocalData();
  }, [user, authLoading]);

  const [isSyncingOffline, setIsSyncingOffline] = useState(false);

  // Trigger offline-to-online migration when user logs in and local data is loaded
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- Toggle sync flag when loading state narrows user login */
    if (user && !isLoading) {
      setIsSyncingOffline(true);
    } else {
      setIsSyncingOffline(false);
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [user, isLoading]);

  // One-time migration of offline data to Firestore on login
  useEffect(() => {
    if (!isConfigured || !db || !user || isLoading || !isSyncingOffline) return;

    const uid = user.uid;

    async function syncOfflineData() {
      try {
        // Sync Clients
        const unsyncedClients = clients.filter(c => c.id.startsWith('local_'));
        for (const item of unsyncedClients) {
          await setDoc(doc(db, `users/${uid}/clients`, item.id), sanitizeForFirestore(item));
        }

        // Sync Products
        const unsyncedProducts = products.filter(p => p.id.startsWith('local_'));
        for (const item of unsyncedProducts) {
          await setDoc(doc(db, `users/${uid}/products`, item.id), sanitizeForFirestore(item));
        }

        // Sync Invoices
        const unsyncedInvoices = invoices.filter(i => i.id.startsWith('local_'));
        for (const item of unsyncedInvoices) {
          await setDoc(doc(db, `users/${uid}/invoices`, item.id), sanitizeForFirestore(item));
        }

        // Sync Estimates
        const unsyncedEstimates = estimates.filter(e => e.id.startsWith('local_'));
        for (const item of unsyncedEstimates) {
          await setDoc(doc(db, `users/${uid}/estimates`, item.id), sanitizeForFirestore(item));
        }

        // Sync Payments
        const unsyncedPayments = payments.filter(p => p.id.startsWith('local_'));
        for (const item of unsyncedPayments) {
          await setDoc(doc(db, `users/${uid}/payments`, item.id), sanitizeForFirestore(item));
        }

        // Sync Business Profile (always sync if profile exists local)
        if (businessProfile) {
          await setDoc(doc(db, `users/${uid}/profile/business`), sanitizeForFirestore(businessProfile));
        }
      } catch (err) {
        console.error("Failed to sync offline data to Firestore:", err);
      } finally {
        setIsSyncingOffline(false);
      }
    }

    syncOfflineData();
  }, [user, isLoading, isSyncingOffline]);

  // Listen to Firestore if configured, user is logged in, and migration completed
  useEffect(() => {
    if (!isConfigured || !db || !user || isLoading || isSyncingOffline) return;

    const uid = user.uid;

    const unsubClients = onSnapshot(collection(db, `users/${uid}/clients`), (snap) => {
      const items = snap.docs.map(doc => ({ ...doc.data(), id: doc.id })) as Client[];
      setClients(items);
      AsyncStorage.setItem(`@invonest_clients_${uid}`, JSON.stringify(items));
    });

    const unsubProducts = onSnapshot(collection(db, `users/${uid}/products`), (snap) => {
      const items = snap.docs.map(doc => ({ ...doc.data(), id: doc.id })) as Product[];
      setProducts(items);
      AsyncStorage.setItem(`@invonest_products_${uid}`, JSON.stringify(items));
    });

    const unsubInvoices = onSnapshot(collection(db, `users/${uid}/invoices`), (snap) => {
      const items = snap.docs.map(doc => ({ ...doc.data(), id: doc.id })) as Invoice[];
      setInvoices(items);
      AsyncStorage.setItem(`@invonest_invoices_${uid}`, JSON.stringify(items));
    });

    const unsubEstimates = onSnapshot(collection(db, `users/${uid}/estimates`), (snap) => {
      const items = snap.docs.map(doc => ({ ...doc.data(), id: doc.id })) as Estimate[];
      setEstimates(items);
      AsyncStorage.setItem(`@invonest_estimates_${uid}`, JSON.stringify(items));
    });

    const unsubPayments = onSnapshot(collection(db, `users/${uid}/payments`), (snap) => {
      const items = snap.docs.map(doc => ({ ...doc.data(), id: doc.id })) as Payment[];
      setPayments(items);
      AsyncStorage.setItem(`@invonest_payments_${uid}`, JSON.stringify(items));
    });

    const unsubProfile = onSnapshot(doc(db, `users/${uid}/profile/business`), (snap) => {
      if (snap.exists()) {
        const item = snap.data() as BusinessProfile;
        setBusinessProfile(item);
        AsyncStorage.setItem(`@invonest_profile_${uid}`, JSON.stringify(item));
      }
    });

    return () => {
      unsubClients();
      unsubProducts();
      unsubInvoices();
      unsubEstimates();
      unsubPayments();
      unsubProfile();
    };
  }, [user, isLoading, isSyncingOffline]);

  // Generic helper to save items
  const saveItem = async <T extends { id: string }>(
    collectionName: string,
    item: Omit<T, 'id'> & { id?: string },
    currentList: T[],
    setList: React.Dispatch<React.SetStateAction<T[]>>,
    localStorageKey: string
  ): Promise<T> => {
    const id = item.id || `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const savedItem = { ...item, id } as unknown as T;

    // Update local state
    const updatedList = item.id 
      ? currentList.map(existing => existing.id === item.id ? savedItem : existing)
      : [...currentList, savedItem];
    
    setList(updatedList);
    await AsyncStorage.setItem(getNamespacedKey(localStorageKey), JSON.stringify(updatedList));

    // Sync to Firestore if user logged in
    if (isConfigured && db && user) {
      try {
        await setDoc(doc(db, `users/${user.uid}/${collectionName}`, id), sanitizeForFirestore(savedItem));
      } catch (err) {
        console.error(`Firestore save error in ${collectionName}:`, err);
      }
    }

    return savedItem;
  };

  // Generic helper to delete items
  const deleteItem = async <T extends { id: string }>(
    collectionName: string,
    id: string,
    currentList: T[],
    setList: React.Dispatch<React.SetStateAction<T[]>>,
    localStorageKey: string
  ) => {
    const updatedList = currentList.filter(item => item.id !== id);
    setList(updatedList);
    await AsyncStorage.setItem(getNamespacedKey(localStorageKey), JSON.stringify(updatedList));

    if (isConfigured && db && user) {
      try {
        await deleteDoc(doc(db, `users/${user.uid}/${collectionName}`, id));
      } catch (err) {
        console.error(`Firestore delete error in ${collectionName}:`, err);
      }
    }
  };

  const saveClient = async (client: Omit<Client, 'id'> & { id?: string }) => {
    await saveItem('clients', client, clients, setClients, '@invonest_clients');
  };

  const deleteClient = async (id: string) => {
    await deleteItem('clients', id, clients, setClients, '@invonest_clients');
  };

  const saveProduct = async (product: Omit<Product, 'id'> & { id?: string }) => {
    await saveItem('products', product, products, setProducts, '@invonest_products');
  };

  const deleteProduct = async (id: string) => {
    await deleteItem('products', id, products, setProducts, '@invonest_products');
  };

  const saveInvoice = async (invoice: Omit<Invoice, 'id'> & { id?: string }) => {
    const saved = await saveItem<Invoice>('invoices', invoice, invoices, setInvoices, '@invonest_invoices');
    
    // Trigger notification scheduling
    if (saved.status !== 'Paid' && saved.status !== 'Draft') {
      const clientObj = clients.find(c => c.id === saved.clientId);
      if (clientObj) {
        const daysBefore = businessProfile?.reminderDaysBefore || 3;
        await scheduleInvoiceReminder(
          saved.id,
          saved.invoiceNumber,
          clientObj.name,
          new Date(saved.dueDate),
          daysBefore,
          user?.uid
        );
        // Announce via TTS if voice reminders are enabled
        if (businessProfile?.voiceRemindersEnabled) {
          announceInvoiceReminder(
            saved.invoiceNumber,
            clientObj.name,
            new Date(saved.dueDate),
            daysBefore
          );
        }
      }
    } else if (saved.status === 'Paid') {
      await cancelInvoiceReminders(saved.id);
    }
  };

  const deleteInvoice = async (id: string) => {
    await deleteItem('invoices', id, invoices, setInvoices, '@invonest_invoices');
    await cancelInvoiceReminders(id);
  };

  const saveEstimate = async (estimate: Omit<Estimate, 'id'> & { id?: string }) => {
    await saveItem<Estimate>('estimates', estimate, estimates, setEstimates, '@invonest_estimates');
  };

  const deleteEstimate = async (id: string) => {
    await deleteItem('estimates', id, estimates, setEstimates, '@invonest_estimates');
  };

  const convertToInvoice = async (estimateId: string) => {
    const est = estimates.find((e) => e.id === estimateId);
    if (!est) throw new Error('Estimate not found');
    
    // Calculate next invoice number
    const lastInvoice = invoices.reduce((max, inv) => {
      const num = parseInt(inv.invoiceNumber.replace(/[^0-9]/g, ''), 10);
      return !isNaN(num) && num > max ? num : max;
    }, 0);
    const nextInvoiceNumber = `INV-${String(lastInvoice + 1).padStart(4, '0')}`;

    const newInvoice: Omit<Invoice, 'id'> = {
      invoiceNumber: nextInvoiceNumber,
      clientId: est.clientId,
      items: est.items,
      subtotal: est.subtotal,
      tax: est.tax,
      discount: est.discount,
      lateFee: 0,
      total: est.total,
      currency: est.currency,
      status: 'Draft',
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days default
      createdAt: new Date().toISOString(),
      templateId: est.templateId || 'classic',
      notes: est.notes
    };

    await saveInvoice(newInvoice);
    await saveEstimate({
      ...est,
      status: 'Converted'
    });
  };

  const savePayment = async (payment: Omit<Payment, 'id'> & { id?: string }) => {
    await saveItem<Payment>('payments', payment, payments, setPayments, '@invonest_payments');
  };

  const deletePayment = async (id: string) => {
    await deleteItem('payments', id, payments, setPayments, '@invonest_payments');
  };

  const saveBusinessProfile = async (profile: BusinessProfile) => {
    setBusinessProfile(profile);
    await AsyncStorage.setItem(getNamespacedKey('@invonest_profile'), JSON.stringify(profile));

    // Mark setup as completed so index.tsx can reliably route to dashboard
    if (user) {
      await AsyncStorage.setItem(`@invonest_setup_completed_${user.uid}`, 'true');
    }

    if (isConfigured && db && user) {
      try {
        await setDoc(doc(db, `users/${user.uid}/profile/business`), sanitizeForFirestore(profile));
      } catch (err) {
        console.error('Firestore save error in profile:', err);
      }
    }
  };
  const saveThemeMode = async (mode: 'light' | 'dark' | 'system') => {
    try {
      setThemeModeState(mode);
      await AsyncStorage.setItem('@invonest_theme', mode);
    } catch (err) {
      console.error('Failed to save theme mode setting:', err);
    }
  };
  return (
    <DataContext.Provider
      value={{
        clients,
        products,
        invoices,
        estimates,
        payments,
        businessProfile,
        saveClient,
        deleteClient,
        saveProduct,
        deleteProduct,
        saveInvoice,
        deleteInvoice,
        saveEstimate,
        deleteEstimate,
        convertToInvoice,
        savePayment,
        deletePayment,
        saveBusinessProfile,
        themeMode,
        saveThemeMode,
        isLoading
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}

// Utility to recursively strip undefined properties since Firestore does not support them
function sanitizeForFirestore(obj: any): any {
  if (obj === null || obj === undefined) return null;
  if (Array.isArray(obj)) {
    return obj.map(sanitizeForFirestore);
  }
  if (typeof obj === 'object') {
    const sanitized: any = {};
    for (const key in obj) {
      if (obj[key] !== undefined) {
        sanitized[key] = sanitizeForFirestore(obj[key]);
      }
    }
    return sanitized;
  }
  return obj;
}