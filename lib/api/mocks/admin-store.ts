import "server-only";
import { randomUUID } from "node:crypto";
import { ApiError } from "../client";
import { findMockUserByEmail } from "./auth-store";
import { mockProducts } from "./products";
import type { DocumentType } from "../vendor-profile";

/**
 * In-memory stand-in for the admin/Staff backend (Vendors, Staff, Roles,
 * Products moderation, Audit log), same idiom as
 * lib/api/mocks/vendor-profile-store.ts and auth-store.ts (globalThis-pinned
 * so Next dev/Turbopack module re-evaluation doesn't wipe it — see
 * docs/MOCK_AUTH.md). Governed by ADMIN_DATA_SOURCE (lib/api/admin/*.ts).
 *
 * Vendor entity names below (Mecoson Medical Supplies, Celsius Sc & Tech Ltd,
 * Best Medical Equipment) and the "Sales Rep"/"Stock Keeper" role names and
 * Muhammed/Tunde/Chioma staff names match the client-supplied mockups
 * (super admin/*.pdf) rather than being invented from scratch.
 */

// ---- Roles ----

export interface MockRole {
  id: string;
  name: string;
  displayName: string;
  description: string;
  isActive: boolean;
  createdAt: string;
  permissions: { id: string; name: string | null; description: string | null; resource: string }[];
}

const globalForAdminMock = globalThis as unknown as {
  __vitalinkMockRoles?: MockRole[];
  __vitalinkMockStaff?: MockStaffMember[];
  __vitalinkMockVendors?: MockAdminVendor[];
  __vitalinkMockAudit?: MockAuditEntry[];
  __vitalinkMockOrders?: MockAdminOrder[];
  __vitalinkMockTransactions?: MockAdminTransaction[];
  __vitalinkMockSettlements?: MockSettlement[];
  __vitalinkMockDocumentRequirements?: MockDocumentRequirement[];
};

const roles: MockRole[] =
  globalForAdminMock.__vitalinkMockRoles ??
  [
    {
      id: "role_super-admin",
      name: "SuperAdmin",
      displayName: "Super Admin",
      description: "Full access to every admin surface.",
      isActive: true,
      createdAt: "2026-01-05T09:00:00Z",
      permissions: [{ id: "perm_all", name: "All permissions", description: null, resource: "*" }],
    },
    {
      id: "role_sales-rep",
      name: "SalesRep",
      displayName: "Sales Rep",
      description: "Reviews vendor applications and manages orders.",
      isActive: true,
      createdAt: "2026-02-10T09:00:00Z",
      permissions: [
        { id: "perm_vendors_list", name: "List vendors", description: null, resource: "Vendors" },
        { id: "perm_vendors_approve", name: "Approve vendors", description: null, resource: "Vendors" },
      ],
    },
    {
      id: "role_stock-keeper",
      name: "StockKeeper",
      displayName: "Stock Keeper",
      description: "Moderates the product catalog.",
      isActive: true,
      createdAt: "2026-02-10T09:05:00Z",
      permissions: [
        { id: "perm_products_list", name: "List products", description: null, resource: "Products" },
        { id: "perm_products_approve", name: "Approve products", description: null, resource: "Products" },
      ],
    },
  ];
globalForAdminMock.__vitalinkMockRoles = roles;

export function listMockRoles(): MockRole[] {
  return roles;
}

export function getMockRoleDetails(roleId: string): MockRole | undefined {
  return roles.find((r) => r.id === roleId);
}

// ---- Staff ----

export interface MockStaffMember {
  id: string;
  name: string;
  email: string;
  role: string[];
  phone: string | null;
  avatarUrl: string | null;
  lastLoginAt: string | null;
  isActive: boolean;
  /** Every new invite needs Super Admin review before it's active — "Users"
   * going under review isn't just vendors/products. Seeded staff are
   * pre-approved (they were never invited through this flow). */
  approvalStatus: "Approved" | "PendingReview";
  createdAt: string;
}

function seedStaffOnce(): MockStaffMember[] {
  const existing = globalForAdminMock.__vitalinkMockStaff;
  if (existing) return existing;

  const seeded: MockStaffMember[] = [];
  const demoStaffUser = findMockUserByEmail("staff@vitalink.dev");
  if (demoStaffUser) {
    seeded.push({
      id: demoStaffUser.userId,
      name: demoStaffUser.displayName,
      email: demoStaffUser.email,
      role: ["Super Admin"],
      phone: demoStaffUser.phone ?? null,
      avatarUrl: null,
      lastLoginAt: new Date().toISOString(),
      isActive: true,
      approvalStatus: "Approved",
      createdAt: "2026-01-05T09:00:00Z",
    });
  }
  seeded.push(
    {
      id: randomUUID(),
      name: "Muhammed Bello",
      email: "muhammed@vitalink.dev",
      role: ["Sales Rep"],
      phone: "+2348012345671",
      avatarUrl: null,
      lastLoginAt: "2026-08-20T08:30:00Z",
      isActive: true,
      approvalStatus: "Approved",
      createdAt: "2026-03-12T09:00:00Z",
    },
    {
      id: randomUUID(),
      name: "Tunde Adewale",
      email: "tunde@vitalink.dev",
      role: ["Stock Keeper"],
      phone: "+2348012345672",
      avatarUrl: null,
      lastLoginAt: "2026-08-18T14:10:00Z",
      isActive: true,
      approvalStatus: "Approved",
      createdAt: "2026-04-02T09:00:00Z",
    },
    {
      id: randomUUID(),
      name: "Chioma Nwosu",
      email: "chioma@vitalink.dev",
      role: ["Sales Rep"],
      phone: null,
      avatarUrl: null,
      lastLoginAt: null,
      isActive: true,
      approvalStatus: "PendingReview",
      createdAt: "2026-06-19T09:00:00Z",
    },
  );
  globalForAdminMock.__vitalinkMockStaff = seeded;
  return seeded;
}

export function listMockStaff(): MockStaffMember[] {
  return seedStaffOnce();
}

export interface CreateMockStaffInput {
  name: string;
  email: string;
  phone?: string;
  roleIds: string[];
}

export function createMockStaff(input: CreateMockStaffInput): MockStaffMember {
  const staff = seedStaffOnce();
  const roleNames = input.roleIds.map((id) => roles.find((r) => r.id === id)?.displayName).filter((n): n is string => Boolean(n));
  const member: MockStaffMember = {
    id: randomUUID(),
    name: input.name,
    email: input.email,
    role: roleNames,
    phone: input.phone ?? null,
    avatarUrl: null,
    lastLoginAt: null,
    isActive: true,
    approvalStatus: "PendingReview",
    createdAt: new Date().toISOString(),
  };
  staff.push(member);
  return member;
}

function requireStaffMember(staffId: string): MockStaffMember {
  const member = seedStaffOnce().find((s) => s.id === staffId);
  if (!member) throw new ApiError(404, "Staff member not found.");
  return member;
}

export function approveMockStaff(staffId: string): void {
  requireStaffMember(staffId).approvalStatus = "Approved";
}

export function suspendMockStaff(staffId: string): void {
  const member = requireStaffMember(staffId);
  member.isActive = false;
}

// ---- Vendors (admin compliance queue) ----

export interface MockAdminAddress {
  addressLine: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  postalCode: string | null;
}

export interface MockAdminVendor {
  id: string;
  businessLegalName: string;
  vendorType: string;
  businessLogoUrl: string | null;
  contactName: string | null;
  businessPhone: string | null;
  businessEmail: string | null;
  verificationStatus: "Pending" | "UnderReview" | "Verified" | "Rejected";
  createdAt: string;
  taxId: string | null;
  businessRegistrationNumber: string | null;
  businessAddress: MockAdminAddress | null;
  websiteUrl: string | null;
  applicantFirstName: string | null;
  applicantLastName: string | null;
  applicantEmail: string | null;
  applicantPhone: string | null;
  applicantAvatarUrl: string | null;
  applicantCountry: string | null;
  deliveryAddress: MockAdminAddress | null;
  rejectionReason: string | null;
  documents: { id: string; label: string; required: boolean; uploaded: boolean; fileName: string | null }[];
}

function seedVendorsOnce(): MockAdminVendor[] {
  const existing = globalForAdminMock.__vitalinkMockVendors;
  if (existing) return existing;

  const seeded: MockAdminVendor[] = [
    {
      id: "vendor_mecoson",
      businessLegalName: "Mecoson Medical Supplies",
      vendorType: "Distributor",
      businessLogoUrl: null,
      contactName: "Nnamdi Ejeofor",
      businessPhone: "+234812345678",
      businessEmail: "compliance@mecosonmedical.ng",
      verificationStatus: "UnderReview",
      createdAt: "2026-06-12T10:00:00Z",
      taxId: "NCv1234567890",
      businessRegistrationNumber: "RC-9981234",
      businessAddress: { addressLine: "No #1 Ziks Avenue Enugu", city: "Enugu", state: "Enugu", country: "Nigeria", postalCode: "400001" },
      websiteUrl: null,
      applicantFirstName: "Nnamdi",
      applicantLastName: "Ejeofor",
      applicantEmail: "nnamdiejiofor@gmail.com",
      applicantPhone: "09045128973",
      applicantAvatarUrl: null,
      applicantCountry: "Nigeria",
      deliveryAddress: { addressLine: "No 12 Nza Street, Independence Layout", city: "Enugu", state: "Enugu", country: "Nigeria", postalCode: null },
      rejectionReason: null,
      documents: [
        { id: "doc_1", label: "Business Registration", required: true, uploaded: true, fileName: "cac-certificate.pdf" },
        { id: "doc_2", label: "NAFDAC Registration", required: true, uploaded: true, fileName: "nafdac-cert.pdf" },
        { id: "doc_3", label: "Tax Clearance Certificate", required: false, uploaded: false, fileName: null },
      ],
    },
    {
      id: "vendor_celsius",
      businessLegalName: "Celsius Sc & Tech Ltd",
      vendorType: "Distributor",
      businessLogoUrl: null,
      contactName: "Chidinma Okeke",
      businessPhone: "+234701234567",
      businessEmail: "hello@celsiusscitech.ng",
      verificationStatus: "Pending",
      createdAt: "2026-07-02T09:20:00Z",
      taxId: "NCv2234567890",
      businessRegistrationNumber: "RC-9982345",
      businessAddress: { addressLine: "22 Awolowo Road", city: "Ikoyi", state: "Lagos", country: "Nigeria", postalCode: "101233" },
      websiteUrl: "https://celsiusscitech.ng",
      applicantFirstName: "Chidinma",
      applicantLastName: "Okeke",
      applicantEmail: "chidinma.okeke@celsiusscitech.ng",
      applicantPhone: "08123456789",
      applicantAvatarUrl: null,
      applicantCountry: "Nigeria",
      deliveryAddress: { addressLine: "22 Awolowo Road", city: "Ikoyi", state: "Lagos", country: "Nigeria", postalCode: null },
      rejectionReason: null,
      documents: [
        { id: "doc_4", label: "Business Registration", required: true, uploaded: true, fileName: "celsius-cac.pdf" },
        { id: "doc_5", label: "NAFDAC Registration", required: true, uploaded: false, fileName: null },
      ],
    },
    {
      id: "vendor_best-medical",
      businessLegalName: "Best Medical Equipment",
      vendorType: "Manufacturer",
      businessLogoUrl: null,
      contactName: "Ifeoma Chukwu",
      businessPhone: "+234809988776",
      businessEmail: "ifeoma@bestmedicalequip.ng",
      verificationStatus: "Verified",
      createdAt: "2026-05-18T11:45:00Z",
      taxId: "NCv3234567890",
      businessRegistrationNumber: "RC-9983456",
      businessAddress: { addressLine: "5 Independence Way", city: "Enugu", state: "Enugu", country: "Nigeria", postalCode: "400102" },
      websiteUrl: null,
      applicantFirstName: "Ifeoma",
      applicantLastName: "Chukwu",
      applicantEmail: "ifeoma@bestmedicalequip.ng",
      applicantPhone: "08099887766",
      applicantAvatarUrl: null,
      applicantCountry: "Nigeria",
      deliveryAddress: { addressLine: "5 Independence Way", city: "Enugu", state: "Enugu", country: "Nigeria", postalCode: null },
      rejectionReason: null,
      documents: [
        { id: "doc_6", label: "Business Registration", required: true, uploaded: true, fileName: "best-medical-cac.pdf" },
        { id: "doc_7", label: "NAFDAC Registration", required: true, uploaded: true, fileName: "best-medical-nafdac.pdf" },
      ],
    },
    {
      id: "vendor_apex-scientific",
      businessLegalName: "Apex Scientific Instruments",
      vendorType: "Distributor",
      businessLogoUrl: null,
      contactName: "Bola Adeyemi",
      businessPhone: "+234706655443",
      businessEmail: "bola@apexscientific.ng",
      verificationStatus: "Rejected",
      createdAt: "2026-04-29T16:10:00Z",
      taxId: "NCv4234567890",
      businessRegistrationNumber: "RC-9984567",
      businessAddress: { addressLine: "18 Allen Avenue", city: "Ikeja", state: "Lagos", country: "Nigeria", postalCode: "100281" },
      websiteUrl: null,
      applicantFirstName: "Bola",
      applicantLastName: "Adeyemi",
      applicantEmail: "bola@apexscientific.ng",
      applicantPhone: "07066554433",
      applicantAvatarUrl: null,
      applicantCountry: "Nigeria",
      deliveryAddress: { addressLine: "18 Allen Avenue", city: "Ikeja", state: "Lagos", country: "Nigeria", postalCode: null },
      rejectionReason: "Business registration certificate did not match the legal business name provided.",
      documents: [{ id: "doc_8", label: "Business Registration", required: true, uploaded: true, fileName: "apex-cac.pdf" }],
    },
  ];

  const demoVendorUser = findMockUserByEmail("vendor@vitalink.dev");
  if (demoVendorUser) {
    seeded.push({
      id: `vendor_${demoVendorUser.userId}`,
      businessLegalName: "Femi Vendor Medical Supplies",
      vendorType: "Distributor",
      businessLogoUrl: null,
      contactName: demoVendorUser.displayName,
      businessPhone: demoVendorUser.phone ?? null,
      businessEmail: demoVendorUser.email,
      verificationStatus: "Verified",
      createdAt: "2026-01-10T09:00:00Z",
      taxId: "20-1234567-0001",
      businessRegistrationNumber: "RC-1234567",
      businessAddress: { addressLine: "14 Marina Road", city: "Lagos", state: "Lagos", country: "Nigeria", postalCode: "101241" },
      websiteUrl: null,
      applicantFirstName: demoVendorUser.firstName,
      applicantLastName: demoVendorUser.lastName,
      applicantEmail: demoVendorUser.email,
      applicantPhone: demoVendorUser.phone ?? null,
      applicantAvatarUrl: null,
      applicantCountry: "Nigeria",
      deliveryAddress: { addressLine: "14 Marina Road", city: "Lagos", state: "Lagos", country: "Nigeria", postalCode: null },
      rejectionReason: null,
      documents: [{ id: "doc_demo", label: "Business Registration", required: true, uploaded: true, fileName: "femi-vendor-cac.pdf" }],
    });
  }

  globalForAdminMock.__vitalinkMockVendors = seeded;
  return seeded;
}

export interface ListMockVendorsParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
}

export function listMockVendors(params: ListMockVendorsParams = {}) {
  const all = seedVendorsOnce();
  const filtered = all.filter((v) => {
    if (params.status && v.verificationStatus !== params.status) return false;
    if (params.search && !v.businessLegalName.toLowerCase().includes(params.search.toLowerCase())) return false;
    return true;
  });
  const pageSize = params.pageSize ?? 12;
  const page = Math.max(1, params.page ?? 1);
  const start = (page - 1) * pageSize;
  return {
    data: filtered.slice(start, start + pageSize),
    currentPage: page,
    pageSize,
    totalCount: filtered.length,
    totalPages: Math.max(1, Math.ceil(filtered.length / pageSize)),
  };
}

export function getMockVendorDetails(vendorId: string): MockAdminVendor {
  const vendor = seedVendorsOnce().find((v) => v.id === vendorId);
  if (!vendor) throw new ApiError(404, "Vendor not found.");
  return vendor;
}

export function approveMockVendor(vendorId: string): void {
  getMockVendorDetails(vendorId).verificationStatus = "Verified";
}

export function rejectMockVendor(vendorId: string, reason: string): void {
  const vendor = getMockVendorDetails(vendorId);
  vendor.verificationStatus = "Rejected";
  vendor.rejectionReason = reason;
}

export function markMockVendorUnderReview(vendorId: string): void {
  getMockVendorDetails(vendorId).verificationStatus = "UnderReview";
}

export function listMockVendorDocuments(vendorId: string) {
  const vendor = getMockVendorDetails(vendorId);
  return vendor.documents.map((doc) => {
    if (!doc.uploaded) return { ...doc, previewUrl: null, downloadUrl: null };
    // Same mock upload endpoint the vendor onboarding flow already uses
    // (app/api/mock-uploads/[documentId]/route.ts) — its GET handler now
    // returns a real, openable (if placeholder) response, not a dead link.
    const q = new URLSearchParams({ label: doc.label, vendor: vendor.businessLegalName });
    return {
      ...doc,
      previewUrl: `/api/mock-uploads/${doc.id}?${q.toString()}`,
      downloadUrl: `/api/mock-uploads/${doc.id}?${q.toString()}&download=1`,
    };
  });
}

// ---- Products (Global Inventory) — derived from the same catalog buyers
// browse (lib/api/mocks/products.ts), reshaped for the admin moderation
// table rather than a second, disconnected product list. ----

const PRODUCT_STATUS_CYCLE = ["Active", "Active", "Active", "PendingReview", "Archived", "Rejected"] as const;
const VENDOR_NAME_CYCLE = [
  "Mecoson Medical Supplies",
  "Celsius Sc & Tech Ltd",
  "Best Medical Equipment",
  "Apex Scientific Instruments",
  "Femi Vendor Medical Supplies",
];

export interface MockAdminProduct {
  id: string;
  name: string;
  sku: string | null;
  imageUrl: string | null;
  price: number;
  originalPrice: number | null;
  stock: number | null;
  lowStockThreshold: number | null;
  vendorId: string | null;
  vendorName: string | null;
  brand: string | null;
  categoryLabel: string | null;
  status: string;
  createdAt: string | null;
  shortDescription: string | null;
  manufacturedIn: string | null;
  badge: string | null;
  freeDelivery: boolean;
  technicalSpecs: { label: string; value: string }[];
  includedAccessories: string[];
  clinicalUseCases: string[];
  rejectionReason: string | null;
}

let cachedAdminProducts: MockAdminProduct[] | null = null;
function allMockAdminProducts(): MockAdminProduct[] {
  if (cachedAdminProducts) return cachedAdminProducts;
  const vendorIdByName = new Map(seedVendorsOnce().map((v) => [v.businessLegalName, v.id]));
  cachedAdminProducts = mockProducts.map((product, i) => {
    const vendorName = VENDOR_NAME_CYCLE[i % VENDOR_NAME_CYCLE.length];
    return {
      id: product.id,
      name: product.name,
      sku: product.brandSku ?? null,
      imageUrl: product.imageUrl,
      price: product.price,
      originalPrice: product.originalPrice ?? null,
      stock: product.stockCount ?? null,
      lowStockThreshold: product.lowStockThreshold ?? null,
      vendorId: vendorIdByName.get(vendorName) ?? null,
      vendorName,
      brand: product.brand ?? null,
      categoryLabel: product.categoryLabel ?? null,
      status: PRODUCT_STATUS_CYCLE[i % PRODUCT_STATUS_CYCLE.length],
      createdAt: null,
      shortDescription: product.shortDescription ?? null,
      manufacturedIn: product.manufacturedIn ?? null,
      badge: product.badge ?? null,
      freeDelivery: product.freeDelivery ?? false,
      technicalSpecs: product.technicalSpecs ?? [],
      includedAccessories: product.includedAccessories ?? [],
      clinicalUseCases: product.clinicalUseCases ?? [],
      rejectionReason: null,
    };
  });
  return cachedAdminProducts;
}

export interface ListMockAdminProductsParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
  vendorId?: string;
}

export function listMockAdminProducts(params: ListMockAdminProductsParams = {}) {
  const all = allMockAdminProducts();
  const filtered = all.filter((p) => {
    if (params.status && p.status !== params.status) return false;
    if (params.search && !p.name.toLowerCase().includes(params.search.toLowerCase())) return false;
    return true;
  });
  const pageSize = params.pageSize ?? 12;
  const page = Math.max(1, params.page ?? 1);
  const start = (page - 1) * pageSize;
  return {
    data: filtered.slice(start, start + pageSize),
    currentPage: page,
    pageSize,
    totalCount: filtered.length,
    totalPages: Math.max(1, Math.ceil(filtered.length / pageSize)),
  };
}

export function getMockAdminProductDetails(productId: string): MockAdminProduct {
  const product = allMockAdminProducts().find((p) => p.id === productId);
  if (!product) throw new ApiError(404, "Product not found.");
  return product;
}

export function approveMockAdminProduct(productId: string): void {
  const product = getMockAdminProductDetails(productId);
  product.status = "Active";
  product.rejectionReason = null;
}

export function rejectMockAdminProduct(productId: string, reason: string): void {
  const product = getMockAdminProductDetails(productId);
  product.status = "Rejected";
  product.rejectionReason = reason;
}

// ---- Audit log ----

export interface MockAuditEntry {
  id: string;
  event: string;
  description: string | null;
  severity: string | null;
  ipAddress: string | null;
  actorName: string | null;
  createdAt: string;
}

const audit: MockAuditEntry[] =
  globalForAdminMock.__vitalinkMockAudit ??
  [
    {
      id: randomUUID(),
      event: "Unauthorized Access Attempt",
      description: "Repeated failed login attempts against a Staff account.",
      severity: "high",
      ipAddress: "192.168.1.45",
      actorName: null,
      createdAt: new Date(Date.now() - 1000 * 60 * 40).toISOString(),
    },
    {
      id: randomUUID(),
      event: "Data sync Delay",
      description: "Catalog sync to the EU-West replica fell behind by 4 minutes.",
      severity: "low",
      ipAddress: null,
      actorName: "System",
      createdAt: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
    },
    {
      id: randomUUID(),
      event: "Vendor approved",
      description: "Best Medical Equipment marked Verified.",
      severity: "info",
      ipAddress: null,
      actorName: "Sam Staff",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
    },
  ];
globalForAdminMock.__vitalinkMockAudit = audit;

export function listMockAuditLog(params: { page?: number; pageSize?: number } = {}) {
  const pageSize = params.pageSize ?? 20;
  const page = Math.max(1, params.page ?? 1);
  const start = (page - 1) * pageSize;
  return {
    data: audit.slice(start, start + pageSize),
    currentPage: page,
    pageSize,
    totalCount: audit.length,
    totalPages: Math.max(1, Math.ceil(audit.length / pageSize)),
  };
}

// ---- Orders (platform-wide fulfillment queue) — dashboard's "Fulfill
// Orders — Authorize N pending orders" quick action and the Orders nav
// item, both currently backed by no real Order API (see app/admin/orders'
// prior placeholder comment) — mocked the same way buyer/vendor data is. ----

export interface MockOrderItem {
  productId: string;
  name: string;
  sku: string | null;
  price: number;
  quantity: number;
}

export interface MockOrderActivityEntry {
  label: string;
  at: string;
}

export interface MockAdminOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  vendorName: string;
  itemCount: number;
  total: number;
  status: "Pending" | "Processing" | "Transit" | "Delivered" | "Cancelled";
  placedAt: string;
  deliveryAddress: string;
  items: MockOrderItem[];
  activity: MockOrderActivityEntry[];
}

const ORDER_CUSTOMERS = ["Nkechi Thomson", "Adejumoke Tejuosho", "Ibrahim Sule", "Grace Effiong", "Yusuf Danladi", "Blessing Okoro"];
const ORDER_STATUS_CYCLE = ["Pending", "Processing", "Transit", "Delivered", "Delivered", "Cancelled"] as const;
const ORDER_ADDRESSES = [
  "Ntachi Osa, Independence Layout, Enugu",
  "14 Marina Road, Lagos Island, Lagos",
  "22 Awolowo Road, Ikoyi, Lagos",
  "No 12 Nza Street, Independence Layout, Enugu",
  "5 Independence Way, Enugu",
];

const ORDER_ACTIVITY_STEPS: Record<MockAdminOrder["status"], string[]> = {
  Pending: ["Order placed"],
  Processing: ["Order placed", "Items packaged & serialized"],
  Transit: ["Order placed", "Items packaged & serialized", "Handed to the carrier", "In transit"],
  Delivered: ["Order placed", "Items packaged & serialized", "Handed to the carrier", "In transit", "Delivered & signed"],
  Cancelled: ["Order placed", "Cancelled"],
};

let cachedOrders: MockAdminOrder[] | null = null;
function allMockOrders(): MockAdminOrder[] {
  if (globalForAdminMock.__vitalinkMockOrders) return globalForAdminMock.__vitalinkMockOrders;
  if (cachedOrders) return cachedOrders;
  const catalog = mockProducts;
  const orders: MockAdminOrder[] = Array.from({ length: 34 }, (_, i) => {
    const vendor = VENDOR_NAME_CYCLE[i % VENDOR_NAME_CYCLE.length];
    const itemCount = 1 + ((i * 3) % 4);
    const items: MockOrderItem[] = Array.from({ length: itemCount }, (_, j) => {
      const product = catalog[(i * 5 + j) % catalog.length];
      return {
        productId: product.id,
        name: product.name,
        sku: product.brandSku ?? null,
        price: product.price,
        quantity: 1 + ((i + j) % 3),
      };
    });
    const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const status = ORDER_STATUS_CYCLE[i % ORDER_STATUS_CYCLE.length];
    const placedAt = new Date(Date.now() - i * 1000 * 60 * 60 * 9);
    const steps = ORDER_ACTIVITY_STEPS[status];
    const activity: MockOrderActivityEntry[] = steps.map((label, stepIndex) => ({
      label,
      at: new Date(placedAt.getTime() + stepIndex * 1000 * 60 * 60 * 4).toISOString(),
    }));
    return {
      id: `order_${i}`,
      orderNumber: `VIT-${(100000 + i * 137).toString(36).toUpperCase()}`,
      customerName: ORDER_CUSTOMERS[i % ORDER_CUSTOMERS.length],
      customerEmail: `${ORDER_CUSTOMERS[i % ORDER_CUSTOMERS.length].toLowerCase().replace(/\s+/g, ".")}@example.com`,
      customerPhone: `080${(30000000 + i * 137111) % 100000000}`.slice(0, 11),
      vendorName: vendor,
      itemCount: items.length,
      total,
      status,
      placedAt: placedAt.toISOString(),
      deliveryAddress: ORDER_ADDRESSES[i % ORDER_ADDRESSES.length],
      items,
      activity,
    };
  });
  cachedOrders = orders;
  globalForAdminMock.__vitalinkMockOrders = orders;
  return orders;
}

export function getMockOrderDetails(orderId: string): MockAdminOrder {
  const order = allMockOrders().find((o) => o.id === orderId);
  if (!order) throw new ApiError(404, "Order not found.");
  return order;
}

export interface ListMockOrdersParams {
  page?: number;
  pageSize?: number;
  status?: string;
  search?: string;
}

export function listMockOrders(params: ListMockOrdersParams = {}) {
  const all = allMockOrders();
  const filtered = all.filter((o) => {
    if (params.status && o.status !== params.status) return false;
    if (params.search) {
      const q = params.search.toLowerCase();
      if (!o.orderNumber.toLowerCase().includes(q) && !o.customerName.toLowerCase().includes(q)) return false;
    }
    return true;
  });
  const pageSize = params.pageSize ?? 12;
  const page = Math.max(1, params.page ?? 1);
  const start = (page - 1) * pageSize;
  return {
    data: filtered.slice(start, start + pageSize),
    currentPage: page,
    pageSize,
    totalCount: filtered.length,
    totalPages: Math.max(1, Math.ceil(filtered.length / pageSize)),
  };
}

export function countMockOrdersPending(): number {
  return allMockOrders().filter((o) => o.status === "Pending").length;
}

// ---- Transactions (platform-wide ledger) — super admin/Transaction.pdf ----

export interface MockAdminTransaction {
  id: string;
  transactionId: string;
  type: "Order Revenue" | "Admin Credit" | "Failed Payout" | "Vendor Payout";
  reference: string;
  amount: number;
  status: "Successful" | "Processing" | "Requested" | "Failed";
  createdAt: string;
  vendorName: string | null;
  customerName: string | null;
  paymentMethod: string | null;
  note: string | null;
}

const TRANSACTION_TYPE_CYCLE = ["Order Revenue", "Order Revenue", "Admin Credit", "Order Revenue", "Failed Payout", "Order Revenue"] as const;
const TRANSACTION_STATUS_CYCLE = ["Successful", "Successful", "Successful", "Processing", "Requested", "Failed"] as const;

function allMockTransactions(): MockAdminTransaction[] {
  if (globalForAdminMock.__vitalinkMockTransactions) return globalForAdminMock.__vitalinkMockTransactions;
  const transactions: MockAdminTransaction[] = Array.from({ length: 40 }, (_, i) => {
    const type = TRANSACTION_TYPE_CYCLE[i % TRANSACTION_TYPE_CYCLE.length];
    return {
      id: `txn_${i}`,
      transactionId: `FUN-${(0x7b12 + i * 91).toString(16).toUpperCase()}`,
      type,
      reference: `ORD-${(3452000 + i * 211).toString(36).toUpperCase()}`,
      amount: 45000 + ((i * 5760) % 320000),
      status: TRANSACTION_STATUS_CYCLE[i % TRANSACTION_STATUS_CYCLE.length],
      createdAt: new Date(Date.now() - i * 1000 * 60 * 60 * 7).toISOString(),
      vendorName: type === "Order Revenue" ? VENDOR_NAME_CYCLE[i % VENDOR_NAME_CYCLE.length] : null,
      customerName: type === "Order Revenue" ? ORDER_CUSTOMERS[i % ORDER_CUSTOMERS.length] : null,
      paymentMethod: type === "Order Revenue" ? "Card — Paystack" : null,
      note: type === "Failed Payout" ? "Vendor bank account details could not be verified." : type === "Admin Credit" ? "Manual credit issued by Super Admin." : null,
    };
  });
  globalForAdminMock.__vitalinkMockTransactions = transactions;
  return transactions;
}

export function getMockTransactionDetails(transactionId: string): MockAdminTransaction {
  const txn = allMockTransactions().find((t) => t.id === transactionId);
  if (!txn) throw new ApiError(404, "Transaction not found.");
  return txn;
}

export interface ListMockTransactionsParams {
  page?: number;
  pageSize?: number;
  status?: string;
  search?: string;
}

export function listMockTransactions(params: ListMockTransactionsParams = {}) {
  const all = allMockTransactions();
  const filtered = all.filter((t) => {
    if (params.status && t.status !== params.status) return false;
    if (params.search && !t.reference.toLowerCase().includes(params.search.toLowerCase())) return false;
    return true;
  });
  const pageSize = params.pageSize ?? 12;
  const page = Math.max(1, params.page ?? 1);
  const start = (page - 1) * pageSize;
  return {
    data: filtered.slice(start, start + pageSize),
    currentPage: page,
    pageSize,
    totalCount: filtered.length,
    totalPages: Math.max(1, Math.ceil(filtered.length / pageSize)),
  };
}

export function getMockTransactionSummary() {
  const all = allMockTransactions();
  const totalSales = all.filter((t) => t.type === "Order Revenue" && t.status === "Successful").reduce((sum, t) => sum + t.amount, 0);
  const totalWithdrawn = all.filter((t) => t.type === "Vendor Payout" && t.status === "Successful").reduce((sum, t) => sum + t.amount, 0);
  const fundsInEscrow = Math.round(totalSales * 0.12);
  const platformFees = Math.round(totalSales * 0.05);
  return { totalSales, fundsInEscrow, totalWithdrawn, platformFees };
}

// ---- Analytics (dashboard's Sales Trend + Category Breakdown) ----

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"];

export function getMockSalesTrend(): { label: string; value: number }[] {
  const base = [820000, 1240000, 1890000, 3020000, 2450000, 4310000, 5760000];
  return MONTH_LABELS.map((label, i) => ({ label, value: base[i] }));
}

export function getMockCategoryBreakdown(): { label: string; value: number }[] {
  const products = allMockAdminProducts();
  const totals = new Map<string, number>();
  for (const product of products) {
    const key = product.categoryLabel ?? "Uncategorized";
    totals.set(key, (totals.get(key) ?? 0) + product.price);
  }
  return Array.from(totals.entries())
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);
}

export function getMockTopVendorsByRevenue(): { label: string; value: number }[] {
  const totals = new Map<string, number>();
  for (const txn of allMockTransactions()) {
    if (txn.type !== "Order Revenue" || txn.status !== "Successful" || !txn.vendorName) continue;
    totals.set(txn.vendorName, (totals.get(txn.vendorName) ?? 0) + txn.amount);
  }
  return Array.from(totals.entries())
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);
}

export function getMockOrderStatusBreakdown(): { label: string; value: number }[] {
  const totals = new Map<string, number>();
  for (const order of allMockOrders()) {
    totals.set(order.status, (totals.get(order.status) ?? 0) + 1);
  }
  return Array.from(totals.entries()).map(([label, value]) => ({ label, value }));
}

// ---- Settlements (bulk vendor payout transfer) ----

export interface MockSettlement {
  vendorId: string;
  vendorName: string;
  accountName: string;
  accountNumber: string;
  bankName: string;
  pendingAmount: number;
  lastPayoutAt: string | null;
}

const BANKS = ["Fidelity Bank Plc", "GTBank Plc", "Zenith Bank Plc", "Access Bank Plc"];

function seedSettlementsOnce(): MockSettlement[] {
  const existing = globalForAdminMock.__vitalinkMockSettlements;
  if (existing) return existing;
  const verifiedVendors = seedVendorsOnce().filter((v) => v.verificationStatus === "Verified");
  const seeded: MockSettlement[] = verifiedVendors.map((v, i) => ({
    vendorId: v.id,
    vendorName: v.businessLegalName,
    accountName: v.businessLegalName,
    accountNumber: String(1234500000 + i * 7311),
    bankName: BANKS[i % BANKS.length],
    pendingAmount: 180000 + ((i * 96500) % 950000),
    lastPayoutAt: i === 0 ? null : new Date(Date.now() - (i + 1) * 1000 * 60 * 60 * 24 * 14).toISOString(),
  }));
  globalForAdminMock.__vitalinkMockSettlements = seeded;
  return seeded;
}

export function listMockSettlements(): MockSettlement[] {
  return seedSettlementsOnce();
}

export function processMockBulkTransfer(vendorIds: string[]): { transferred: number; total: number } {
  const settlements = seedSettlementsOnce();
  let total = 0;
  let transferred = 0;
  const transactions = allMockTransactions();
  for (const settlement of settlements) {
    if (!vendorIds.includes(settlement.vendorId) || settlement.pendingAmount <= 0) continue;
    total += settlement.pendingAmount;
    transferred += 1;
    transactions.unshift({
      id: randomUUID(),
      transactionId: `FUN-${randomUUID().slice(0, 8).toUpperCase()}`,
      type: "Vendor Payout",
      reference: settlement.vendorName,
      amount: settlement.pendingAmount,
      status: "Successful",
      createdAt: new Date().toISOString(),
      vendorName: settlement.vendorName,
      customerName: null,
      paymentMethod: "Bank transfer",
      note: `Bulk settlement transfer to ${settlement.bankName} — ${settlement.accountNumber}.`,
    });
    settlement.pendingAmount = 0;
    settlement.lastPayoutAt = new Date().toISOString();
  }
  return { transferred, total };
}

// ---- Document requirements (vendor onboarding config) — lets Staff choose
// which compliance documents the vendor-apply wizard asks for, and whether
// each is required or optional, instead of the fixed set that was previously
// hardcoded straight into vendor-apply-wizard.tsx. Keyed by a stable slot id
// rather than raw DocumentType because the wizard's "Eligibility Status"
// block is one requirement backed by a choice of three DocumentType values
// (FdaRegistration/NafdacRegistration/Other radio group). ----

export interface MockDocumentRequirement {
  key: string;
  label: string;
  description: string;
  appliesTo: "Manufacturer" | "Distributor";
  documentTypes: DocumentType[];
  required: boolean;
  enabled: boolean;
}

function seedDocumentRequirementsOnce(): MockDocumentRequirement[] {
  const existing = globalForAdminMock.__vitalinkMockDocumentRequirements;
  if (existing) return existing;

  const seeded: MockDocumentRequirement[] = [
    {
      key: "iso-certification",
      label: "ISO 13485 Certification",
      description: "Proof of quality management system for medical device design and manufacture.",
      appliesTo: "Manufacturer",
      documentTypes: ["IsoCertification"],
      required: true,
      enabled: true,
    },
    {
      key: "eligibility-document",
      label: "Eligibility Status (FDA / NAFDAC / Other)",
      description: "Regulatory eligibility proof — the vendor picks one of FDA, NAFDAC, or Other.",
      appliesTo: "Manufacturer",
      documentTypes: ["FdaRegistration", "NafdacRegistration", "Other"],
      required: true,
      enabled: true,
    },
    {
      key: "business-registration",
      label: "Business Registration",
      description: "Proof the entity is a legally registered distributor/supplier.",
      appliesTo: "Distributor",
      documentTypes: ["BusinessRegistration"],
      required: true,
      enabled: true,
    },
  ];
  globalForAdminMock.__vitalinkMockDocumentRequirements = seeded;
  return seeded;
}

export function listMockDocumentRequirements(): MockDocumentRequirement[] {
  return seedDocumentRequirementsOnce();
}

export function updateMockDocumentRequirement(
  key: string,
  patch: { required?: boolean; enabled?: boolean },
): MockDocumentRequirement {
  const requirements = seedDocumentRequirementsOnce();
  const requirement = requirements.find((r) => r.key === key);
  if (!requirement) {
    throw new ApiError(404, `Unknown document requirement "${key}".`);
  }
  if (patch.required !== undefined) requirement.required = patch.required;
  if (patch.enabled !== undefined) requirement.enabled = patch.enabled;
  return requirement;
}
