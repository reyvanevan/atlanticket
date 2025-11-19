# 🗄️ FIRESTORE DATABASE STRUCTURE - ATLANTICKET

## Overview
Database untuk sistem pemesanan tiket otomatis via WhatsApp Bot.

**Project ID:** `atlanticket-def3c`  
**Location:** `asia-southeast2 (Jakarta)`  
**Mode:** Production

---

## 📊 Collections

```
atlanticket-def3c/
├── users/           # User management & profiles
├── events/          # Events/concerts/shows
├── tickets/         # Individual tickets
├── orders/          # Booking transactions
├── payments/        # Payment records
├── settings/        # Bot configuration
└── logs/            # Activity logs
```

---

## 1️⃣ Users Collection

**Path:** `users/{phoneNumber}`

```javascript
{
  // Identity
  phoneNumber: "6281234567890",
  name: "John Doe",
  email: "john@example.com",
  
  // Role & Access
  role: "user",  // "developer" | "admin" | "user"
  permissions: ["view_tickets", "book_tickets"],
  
  // Loyalty
  level: "silver",  // "bronze" | "silver" | "gold" | "platinum"
  points: 150,
  
  // Activity
  registeredAt: Timestamp,
  lastActive: Timestamp,
  isActive: true,
  isBanned: false,
  
  // Stats
  totalOrders: 5,
  totalSpent: 500000,
  
  // Profile
  avatar: "https://...",
  address: "Jakarta",
  
  // Preferences
  notifications: {
    whatsapp: true,
    email: false
  }
}
```

**Sub-collections:**
- `users/{phoneNumber}/orders/` - User's orders
- `users/{phoneNumber}/tickets/` - User's tickets

---

## 2️⃣ Events Collection

**Path:** `events/{eventId}`

```javascript
{
  // Basic
  eventId: "EVT-20251219-001",
  title: "Konser Dewa 19 2025",
  description: "Konser comeback...",
  category: "concert",
  
  // Details
  venue: "Stadion GBK",
  address: "Jakarta Pusat",
  eventDate: Timestamp,
  doorsOpen: "18:00",
  showStart: "19:00",
  
  // Tickets
  totalTickets: 5000,
  availableTickets: 3200,
  soldTickets: 1800,
  
  // Tiers
  ticketTiers: [
    {
      tier: "VIP",
      price: 1500000,
      available: 100,
      sold: 80,
      benefits: ["Front row", "Meet & greet"]
    }
  ],
  
  // Status
  status: "on_sale",  // "draft" | "on_sale" | "sold_out" | "cancelled"
  isActive: true,
  isFeatured: true,
  
  // Media
  poster: "https://...",
  gallery: ["url1", "url2"],
  
  // Management
  createdBy: "6281224258870",
  managedBy: ["628..."],
  createdAt: Timestamp
}
```

---

## 3️⃣ Tickets Collection

**Path:** `tickets/{ticketId}`

```javascript
{
  // Identity
  ticketId: "TIX-EVT001-VIP-0001",
  qrCode: "https://...qr.png",
  barcode: "1234567890",
  
  // Event
  eventId: "EVT-20251219-001",
  eventTitle: "Konser Dewa 19",
  eventDate: Timestamp,
  
  // Details
  tier: "VIP",
  price: 1500000,
  seatNumber: "A12",
  section: "VIP A",
  
  // Owner
  ownerId: "6281234567890",
  ownerName: "John Doe",
  orderId: "ORD-20251119-12345",
  
  // Status
  status: "active",  // "available" | "sold" | "used" | "cancelled"
  isTransferable: true,
  
  // Usage
  usedAt: null,
  usedBy: null,
  
  // Metadata
  purchasedAt: Timestamp,
  validFrom: Timestamp,
  validUntil: Timestamp
}
```

---

## 4️⃣ Orders Collection

**Path:** `orders/{orderId}`

```javascript
{
  // Identity
  orderId: "ORD-20251119-12345",
  orderNumber: "ATL-2025-12345",
  refId: "ATLAN19154230",
  
  // Customer
  userId: "6281234567890",
  customerName: "John Doe",
  customerPhone: "6281234567890",
  
  // Event
  eventId: "EVT-20251219-001",
  eventTitle: "Konser Dewa 19",
  
  // Tickets
  tickets: [
    {
      ticketId: "TIX-...",
      tier: "VIP",
      price: 1500000,
      quantity: 2
    }
  ],
  
  // Pricing
  subtotal: 3000000,
  adminFee: 5000,
  discount: 0,
  total: 3005000,
  
  // Payment
  paymentMethod: "qris",
  paymentStatus: "pending",  // "pending" | "paid" | "failed"
  paidAt: null,
  
  // Status
  status: "pending",  // "pending" | "confirmed" | "completed" | "cancelled"
  
  // Fulfillment
  ticketsSent: false,
  ticketsSentAt: null,
  
  // Timeline
  createdAt: Timestamp,
  expiresAt: Timestamp,
  completedAt: null,
  
  // Management
  processedBy: null,
  adminNotes: ""
}
```

---

## 5️⃣ Payments Collection

**Path:** `payments/{paymentId}`

```javascript
{
  // Identity
  paymentId: "PAY-20251119-12345",
  orderId: "ORD-20251119-12345",
  refId: "ATLAN19154230",
  
  // Amount
  amount: 3005000,
  currency: "IDR",
  
  // Method
  method: "qris",
  provider: "OrderKuota",
  
  // QRIS
  qrisCode: "00020101...",
  merchantId: "OK2404581",
  
  // Status
  status: "pending",  // "pending" | "success" | "failed"
  
  // Verification
  verifiedAt: null,
  verifiedBy: null,
  
  // Timestamps
  createdAt: Timestamp,
  paidAt: null,
  expiresAt: Timestamp
}
```

---

## 6️⃣ Settings Collection

**Path:** `settings/bot_config` & `settings/roles`

```javascript
// settings/bot_config
{
  botName: "Atlanticket Bot",
  botNumber: "6285166328091",
  version: "1.0.0",
  
  features: {
    autoReply: true,
    paymentReminder: true
  },
  
  payment: {
    qrisEnabled: true,
    paymentExpiry: 86400,
    adminFee: 5000
  }
}

// settings/roles
{
  developer: {
    permissions: ["*"],
    users: ["6281224258870"]
  },
  admin: {
    permissions: [
      "confirm_payment",
      "manage_events",
      "send_tickets"
    ],
    users: ["6289653544913"]
  },
  user: {
    permissions: [
      "view_events",
      "create_order"
    ]
  }
}
```

---

## 7️⃣ Logs Collection

**Path:** `logs/{logId}`

```javascript
{
  logId: "LOG-20251119-12345",
  action: "order_created",
  entity: "order",
  entityId: "ORD-...",
  
  actorId: "6281234567890",
  actorRole: "user",
  actorName: "John Doe",
  
  description: "User created order...",
  status: "success",
  
  createdAt: Timestamp,
  ipAddress: "103.xxx.xxx.xxx"
}
```

---

## 📑 Indexes Required

```javascript
// events
events: eventDate ASC, status ASC
events: category ASC, eventDate ASC

// orders  
orders: userId ASC, createdAt DESC
orders: status ASC, createdAt DESC

// tickets
tickets: ownerId ASC, status ASC
tickets: eventId ASC, status ASC

// payments
payments: orderId ASC, createdAt DESC
payments: status ASC, createdAt DESC
```

---

## 🚀 Implementation Phases

### Phase 1: Core (Day 1-2)
- ✅ Initialize collections
- ✅ Setup security rules
- ✅ Create indexes

### Phase 2: Events (Day 3-4)
- Create event command
- List events command
- View event details

### Phase 3: Booking (Day 5-7)
- Order creation
- QRIS payment
- Ticket delivery

### Phase 4: Management (Day 8-10)
- User registration
- Order history
- Admin dashboard

---

**Last Updated:** November 19, 2025  
**Version:** 1.0.0
