import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

const STORAGE_KEY = "sheqbuddy-admin-portal-v1";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://api.sheqbuddy.com";
const API_WORKSPACE_KEY = import.meta.env.VITE_API_WORKSPACE_KEY || "sheqbuddy-admin";
const ADMIN_EMAIL = "admin@sheqbuddy.com";
const ADMIN_PASSWORD = "SHEQAdmin1";
const PAYPAL_PAYMENT_URL = "https://www.paypal.com/ncp/payment/GZ5K6E5GYGX5W";
const BANK_TRANSFER_DETAILS = "RAMA Technologies, NAB, BSB 084-789, Acc 11-868-5826";
const SAMPLE_INVOICE_URL = "https://sheqbuddy.com/docs/sample-tax-invoice.html";

const plans = ["Starter - 10 users", "Business - 50 users", "Enterprise - custom"];
const paymentMethods = ["Credit card", "PayPal", "Bank transfer", "Manual invoice"];
const paymentStatuses = ["Pending", "Paid", "Waived", "Trial", "Refunded", "Rejected", "Expired"];
const tenantStatuses = ["Active", "Suspended", "Expired", "Cancelled"];
const licenceStatuses = ["Active", "Suspended", "Expired", "Cancelled", "Trial"];
const platforms = ["Web", "Windows", "Android", "iOS"];

const seedState = {
  loggedIn: false,
  selectedView: "register",
  settings: {
    downloadLink: "https://app.sheqbuddy.com",
    demoLink: "https://demo.sheqbuddy.com",
    paymentPortalName: "SHEQBuddy payment portal",
    paymentLink: PAYPAL_PAYMENT_URL,
    sampleInvoiceLink: SAMPLE_INVOICE_URL,
    bankTransferDetails: BANK_TRANSFER_DETAILS,
    adminEmail: "admin@sheqbuddy.com",
    supportEmail: "info@SHEQBuddy.com",
    emailFooter:
      "Remote and Mobile Applications Technologies Pty Ltd. Payment access is managed separately from the SHEQBuddy app."
  },
  registrations: [
    {
      id: "REG-0001",
      createdAt: todayIso(),
      company: "Acme Civil",
      businessNumber: "ABN 12 345 678 901",
      contactName: "Sam Taylor",
      email: "sam@acme.example",
      phone: "0400 000 000",
      plan: "Starter - 10 users",
      requestedUsers: "10",
      paymentMethod: "Credit card",
      paymentReference: "CC-DEMO-1042",
      paymentStatus: "Pending",
      stage: "Pending payment",
      activationCode: "",
      notes: "Awaiting offline payment confirmation."
    },
    {
      id: "REG-0002",
      createdAt: todayIso(),
      company: "Northline Manufacturing",
      businessNumber: "ACN 123 456 789",
      contactName: "Avery Morgan",
      email: "avery@northline.example",
      phone: "0400 111 222",
      plan: "Business - 50 users",
      requestedUsers: "50",
      paymentMethod: "PayPal",
      paymentReference: "PP-DEMO-9088",
      paymentStatus: "Paid",
      stage: "Enabled",
      activationCode: "SHEQ-NOR-6F29-91DA",
      notes: "Payment verified by admin."
    }
  ],
  licences: [
    {
      id: "LIC-0001",
      tenantId: "TEN-0001",
      registrationId: "REG-0002",
      company: "Northline Manufacturing",
      contactName: "Avery Morgan",
      email: "avery@northline.example",
      plan: "Business - 50 users",
      userLimit: "50",
      status: "Active",
      paymentStatus: "Paid",
      activationCode: "SHEQ-NOR-6F29-91DA",
      startDate: todayIso(),
      renewalDate: addYears(todayIso(), 1)
    }
  ],
  tenants: [
    {
      id: "TEN-0001",
      company: "Northline Manufacturing",
      primaryContact: "Avery Morgan",
      email: "avery@northline.example",
      status: "Active",
      licenceId: "LIC-0001",
      createdAt: todayIso(),
      disabledAt: "",
      notes: "Active demo tenant."
    }
  ],
  devices: [
    {
      id: "DEV-0001",
      tenantId: "TEN-0001",
      licenceId: "LIC-0001",
      userName: "Avery Morgan",
      platform: "Web",
      deviceName: "Demo browser",
      activationDate: todayIso(),
      lastSync: todayIso(),
      status: "Active"
    }
  ],
  emails: [
    {
      id: "EMAIL-0001",
      registrationId: "REG-0002",
      to: "avery@northline.example",
      subject: "SHEQBuddy app access and activation code",
      body:
        "Hello Avery Morgan,\n\nRemote and Mobile Applications Technologies Pty Ltd has enabled SHEQBuddy access for Northline Manufacturing.\n\nOpen app: https://app.sheqbuddy.com\nActivation code: SHEQ-NOR-6F29-91DA\n\nPayment portal: SHEQBuddy payment portal",
      stage: "Drafted",
      createdAt: todayIso()
    }
  ]
};

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function addYears(value, years) {
  const date = new Date(`${value}T00:00:00`);
  date.setFullYear(date.getFullYear() + years);
  return date.toISOString().slice(0, 10);
}

function addDays(value, days) {
  const date = new Date(`${value}T00:00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function daysBetween(startValue, endValue = todayIso()) {
  const start = new Date(`${startValue}T00:00:00`);
  const end = new Date(`${endValue}T00:00:00`);
  return Math.max(0, Math.round((end - start) / 86400000));
}

function loadState() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return {
      ...seedState,
      ...stored,
      settings: { ...seedState.settings, ...(stored?.settings || {}) },
      registrations: stored?.registrations || seedState.registrations,
      licences: stored?.licences || seedState.licences,
      tenants: stored?.tenants || seedState.tenants,
      devices: stored?.devices || seedState.devices,
      emails: stored?.emails || seedState.emails
    };
  } catch {
    return seedState;
  }
}

function parseRemoteState(remoteState) {
  if (!remoteState) return null;
  if (typeof remoteState === "string") return JSON.parse(remoteState);
  return remoteState;
}

function hydrateRemoteState(remoteState, currentState) {
  const parsed = parseRemoteState(remoteState);
  if (!parsed) return null;

  return {
    ...seedState,
    ...parsed,
    settings: { ...seedState.settings, ...(parsed.settings || {}) },
    registrations: Array.isArray(parsed.registrations) ? parsed.registrations : [],
    licences: Array.isArray(parsed.licences) ? parsed.licences : [],
    tenants: Array.isArray(parsed.tenants) ? parsed.tenants : [],
    devices: Array.isArray(parsed.devices) ? parsed.devices : [],
    emails: Array.isArray(parsed.emails) ? parsed.emails : [],
    loggedIn: currentState.loggedIn,
    selectedView: currentState.selectedView || parsed.selectedView || "register"
  };
}

function asArray(value) {
  if (Array.isArray(value)) return value;
  return value ? [value] : [];
}

function mergeById(remoteItems = [], localItems = [], idField = "id") {
  const merged = new Map();
  asArray(remoteItems).forEach((item) => {
    if (item?.[idField]) merged.set(item[idField], item);
  });
  asArray(localItems).forEach((item) => {
    if (item?.[idField]) merged.set(item[idField], item);
  });
  return [...merged.values()];
}

function mergeAdminStateForSave(localState, remoteState) {
  const remote = parseRemoteState(remoteState) || {};

  return {
    ...seedState,
    ...remote,
    ...localState,
    settings: {
      ...seedState.settings,
      ...(remote.settings || {}),
      ...(localState.settings || {}),
      downloadLink: appAccessLink(localState.settings?.downloadLink || remote.settings?.downloadLink)
    },
    registrations: mergeById(remote.registrations, localState.registrations),
    licences: mergeById(remote.licences, localState.licences),
    tenants: mergeById(remote.tenants, localState.tenants),
    devices: mergeById(remote.devices, localState.devices),
    emails: mergeById(remote.emails, localState.emails),
    loggedIn: false
  };
}

function saveState(nextState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
}

async function loadRemoteState() {
  const response = await fetch(`${API_BASE_URL}/state/admin-portal?key=${encodeURIComponent(API_WORKSPACE_KEY)}`);
  if (!response.ok) return null;
  const data = await response.json();
  return data.ok ? data.state : null;
}

async function saveRemoteState(nextState) {
  const latestRemoteState = await loadRemoteState().catch(() => null);
  const remoteState = latestRemoteState
    ? mergeAdminStateForSave(nextState, latestRemoteState)
    : { ...nextState, settings: { ...nextState.settings, downloadLink: appAccessLink(nextState.settings?.downloadLink) }, loggedIn: false };
  await fetch(`${API_BASE_URL}/state/admin-portal?key=${encodeURIComponent(API_WORKSPACE_KEY)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ state: remoteState })
  });
}

function statusClass(value) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

function formatDate(value) {
  return new Intl.DateTimeFormat("en-AU", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(new Date(`${value}T00:00:00`));
}

function formatInvoiceDate(value = todayIso()) {
  return new Intl.DateTimeFormat("en-AU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(new Date(`${value}T00:00:00`));
}

function currency(value) {
  return `$${Number(value).toFixed(2)}`;
}

function appAccessLink(value = seedState.settings.downloadLink) {
  return String(value || seedState.settings.downloadLink).replace(/\/download\/?$/i, "");
}

function activationCodeFor(registration) {
  const companyCode = registration.company
    .replace(/[^a-z0-9]/gi, "")
    .slice(0, 3)
    .toUpperCase()
    .padEnd(3, "X");
  const randomPart = Math.random().toString(16).slice(2, 10).toUpperCase();
  return `SHEQ-${companyCode}-${randomPart.slice(0, 4)}-${randomPart.slice(4, 8)}`;
}

function nextRegistrationId(registrations) {
  const highest = registrations.reduce((max, item) => {
    const number = Number(item.id.replace(/\D/g, ""));
    return Number.isFinite(number) ? Math.max(max, number) : max;
  }, 0);
  return `REG-${String(highest + 1).padStart(4, "0")}`;
}

function emailBody(registration, settings) {
  const licence = registration.licence;
  return `Hello ${registration.contactName},

Remote and Mobile Applications Technologies Pty Ltd has enabled SHEQBuddy access for ${registration.company}.
${registration.businessNumber ? `\nACN / ABN: ${registration.businessNumber}\n` : ""}

Open app: ${appAccessLink(settings.downloadLink)}
Activation code: ${registration.activationCode}
${licence ? `Licence: ${licence.id}
Tenant ID: ${licence.tenantId}
Plan: ${licence.plan}
User limit: ${licence.userLimit}
Renewal date: ${formatDate(licence.renewalDate)}
` : ""}

Payment portal: ${settings.paymentPortalName}
Payment link: ${settings.paymentLink}
Bank transfer: ${settings.bankTransferDetails}
Support: ${settings.supportEmail}

${settings.emailFooter}`;
}

function invoiceNumberFor(registration) {
  const number = String(registration.id || "").replace(/\D/g, "").padStart(4, "0") || "0001";
  return `SB${number}`;
}

function invoiceAmounts(paymentStatus) {
  const waived = paymentStatus === "Waived" || paymentStatus === "Refunded";
  const subtotal = waived ? 0 : 600;
  const gst = waived ? 0 : 60;
  return {
    rate: 600,
    amount: subtotal,
    subtotal,
    gstTaxablePortion: subtotal,
    gst,
    total: subtotal + gst
  };
}

function invoiceBody(registration, settings, paymentStatus) {
  const licence = registration.licence;
  const amounts = invoiceAmounts(paymentStatus);
  const userCount = licence?.userLimit || registration.requestedUsers || planUserLimit(registration.plan);
  const sampleInvoiceLink = settings.sampleInvoiceLink || SAMPLE_INVOICE_URL;

  return `TAX INVOICE

RAMA Technologies Pty Ltd
SHEQBuddy.com
Elimbah
Queensland
4516
ABN: 90 152 277 793

Tax Invoice to:
Company: ${registration.company}
Contact: ${registration.contactName}
Customer contact email: ${registration.email}
${registration.businessNumber ? `ACN / ABN: ${registration.businessNumber}\n` : ""}
Invoice #: ${invoiceNumberFor(registration)}
Date: ${formatInvoiceDate(todayIso())}
Terms: 15 days from date of invoice

Description: SHEQBuddy Subscription
Users: ${userCount}
Rate: ${currency(amounts.rate)}
Amount: ${currency(amounts.amount)}

Sub Total: ${currency(amounts.subtotal)}
GST taxable portion: ${currency(amounts.gstTaxablePortion)}
GST 10%: ${currency(amounts.gst)}
Total: ${currency(amounts.total)}

Payment status: ${paymentStatus}
Registration: ${registration.id}
${licence ? `Licence: ${licence.id}
Tenant ID: ${licence.tenantId}
Renewal date: ${formatDate(licence.renewalDate)}
` : ""}
Bank details:
National Bank Australia
BIC or SWIFT code: NATAAU3303M
RAMA Technologies Pty Ltd
BSB: 084-789
Acct No: 11-868-5826
162 Victoria Street
Mackay, Qld, 4740

Sample invoice format: ${sampleInvoiceLink}
Support: ${settings.supportEmail}`;
}

function routedRecipients(registration, settings) {
  return [registration.email, settings.supportEmail || seedState.settings.supportEmail]
    .filter(Boolean)
    .filter((email, index, list) => list.indexOf(email) === index)
    .join(", ");
}

function trialNoticeBody(registration, settings) {
  const licence = registration.licence;
  const trialStartDate = licence?.trialStartDate || todayIso();
  const trialEndDate = licence?.trialEndDate || addDays(todayIso(), 30);

  return `Hello ${registration.contactName},

SHEQBuddy has enabled a 30 day free trial for ${registration.company}.

Open app: ${appAccessLink(settings.downloadLink)}
Activation code: ${registration.activationCode}
Licence: ${licence?.id || registration.licenceId}
Tenant ID: ${licence?.tenantId || registration.tenantId}
Trial starts: ${formatDate(trialStartDate)}
Trial ends: ${formatDate(trialEndDate)}
Subscription start date if activated: ${formatDate(licence?.startDate || addDays(todayIso(), 30))}
User limit: ${licence?.userLimit || registration.requestedUsers || planUserLimit(registration.plan)}

This trial notice is routed to the customer contact and SHEQBuddy.
Before the trial ends, the customer can activate the app for the annual subscription or ask SHEQBuddy to deactivate access.

Payment link: ${settings.paymentLink}
Support: ${settings.supportEmail}`;
}

function trialFollowUpBody(registration, settings) {
  const licence = registration.licence;
  const trialStartDate = licence?.trialStartDate || todayIso();
  const trialEndDate = licence?.trialEndDate || addDays(trialStartDate, 30);
  const followUpDate = addDays(trialStartDate, 20);

  return `Hello ${registration.contactName},

This is the 20 day follow-up reminder for the ${registration.company} SHEQBuddy trial.

Send on: ${formatDate(followUpDate)}
Trial ends: ${formatDate(trialEndDate)}
Days remaining at follow-up: 10

To continue using SHEQBuddy after the trial, activate the app by completing payment:
${settings.paymentLink}

If the customer does not want to continue, SHEQBuddy can deactivate the app after the 30 day trial period.

Registration: ${registration.id}
Licence: ${licence?.id || registration.licenceId}
Tenant ID: ${licence?.tenantId || registration.tenantId}
Support: ${settings.supportEmail}`;
}

function trialPaymentRequiredBody(registration, settings) {
  const licence = registration.licence;
  const trialEndDate = licence?.trialEndDate || registration.trialEndDate || todayIso();

  return `Hello ${registration.contactName},

The ${registration.company} SHEQBuddy trial period is ending and payment is now required to keep the app active.

Registration: ${registration.id}
Licence: ${licence?.id || registration.licenceId}
Tenant ID: ${licence?.tenantId || registration.tenantId}
Trial end date: ${formatDate(trialEndDate)}
Annual subscription: $600.00 AUD excluding GST

Please complete payment using the SHEQBuddy payment portal:
${settings.paymentLink}

Once payment has been confirmed, SHEQBuddy will activate the annual subscription period. If payment is not completed, SHEQBuddy may deactivate the trial workspace after the trial period.

Support: ${settings.supportEmail}`;
}

function refundBody(registration, settings) {
  return `Hello ${registration.contactName},

SHEQBuddy has recorded a refund for ${registration.company}.

Registration: ${registration.id}
Payment status: Refunded
Customer contact email: ${registration.email}

Access has not been enabled through this refund action. If app access had already been enabled, suspend the tenant or licence record before confirming the refund is complete.

Support: ${settings.supportEmail}`;
}

function App() {
  const [state, setState] = useState(loadState);
  const [loginError, setLoginError] = useState("");

  useEffect(() => {
    let cancelled = false;
    loadRemoteState()
      .then((remoteState) => {
        if (cancelled || !remoteState) return;
        setState((current) => {
          const next = hydrateRemoteState(remoteState, current);
          if (!next) return current;
          saveState(next);
          return next;
        });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  function updateState(updater, options = {}) {
    setState((current) => {
      const next = typeof updater === "function" ? updater(current) : updater;
      saveState(next);
      if (options.syncRemote !== false) {
        saveRemoteState(next).catch(() => {});
      }
      return next;
    });
  }

  if (!state.loggedIn) {
    return (
      <LoginScreen
        error={loginError}
        onLogin={(email, password) => {
          if (email.toLowerCase() !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
            setLoginError("Invalid admin login.");
            return;
          }
          updateState({ ...state, loggedIn: true }, { syncRemote: false });
        }}
      />
    );
  }

  return <Portal state={state} updateState={updateState} />;
}

function LoginScreen({ error, onLogin }) {
  function submit(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    onLogin(String(form.get("email") || ""), String(form.get("password") || ""));
  }

  return (
    <section className="login-screen">
      <form className="login-card" onSubmit={submit}>
        <p className="eyebrow">SHEQ Admin Registration Portal</p>
        <h1>Admin portal</h1>
        <p className="brand-subtitle">Remote and Mobile Applications Technologies Pty Ltd</p>
        <p className="muted">
          Review registrations, record payment references, verify payment offline,
          enable customers and draft activation emails.
        </p>
        <label>Email <input name="email" type="email" defaultValue={ADMIN_EMAIL} required /></label>
        <label>Password <input name="password" type="password" defaultValue={ADMIN_PASSWORD} required /></label>
        <p className="form-message">{error}</p>
        <button className="primary-button" type="submit">Open portal</button>
      </form>
    </section>
  );
}

function Portal({ state, updateState }) {
  const stats = useMemo(() => {
    const pending = state.registrations.filter((item) => item.paymentStatus === "Pending").length;
    const enabled = state.licences.filter((item) => item.status === "Active").length;
    const trials = state.licences.filter((item) => item.paymentStatus === "Trial" || item.status === "Trial").length;
    const emails = state.emails.length;
    const tenants = state.tenants.length;
    const devices = state.devices.filter((item) => item.status === "Active").length;
    return { pending, enabled, trials, emails, tenants, devices };
  }, [state]);

  function setView(selectedView) {
    updateState({ ...state, selectedView }, { syncRemote: false });
  }

  function logout() {
    updateState({ ...state, loggedIn: false }, { syncRemote: false });
  }

  function exportData() {
    navigator.clipboard?.writeText(JSON.stringify(state, null, 2));
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-row">
          <span className="brand-mark">S</span>
          <div><strong>SHEQBuddy Admin</strong><small>Registration and payment setup</small></div>
        </div>
        <nav className="nav-list">
          {[
            ["register", "New Registration"],
            ["trials", "Trial or Pending"],
            ["queue", "Payment Queue"],
            ["tenants", "Tenants"],
            ["enabled", "Licences"],
            ["devices", "Devices"],
            ["emails", "Email Outbox"],
            ["settings", "Portal Settings"]
          ].map(([view, label]) => (
            <button
              className={`nav-item ${state.selectedView === view ? "active" : ""}`}
              key={view}
              onClick={() => setView(view)}
              type="button"
            >
              {label}
            </button>
          ))}
        </nav>
      </aside>

      <main className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">{viewLabel(state.selectedView)}</p>
            <h2>{viewTitle(state.selectedView)}</h2>
          </div>
          <div className="topbar-actions">
            <button className="secondary-button" onClick={exportData} type="button">Export JSON</button>
            <button className="secondary-button" onClick={logout} type="button">Log out</button>
          </div>
        </header>

        <section className="stats-grid">
          <Stat label="Pending payment" value={stats.pending} />
          <Stat label="Active licences" value={stats.enabled} />
          <Stat label="Trial customers" value={stats.trials} />
          <Stat label="Tenants" value={stats.tenants} />
          <Stat label="Active devices" value={stats.devices} />
          <Stat label="Email drafts" value={stats.emails} />
        </section>

        {state.selectedView === "register" && <RegistrationView state={state} updateState={updateState} />}
        {state.selectedView === "trials" && <TrialOrPendingView state={state} updateState={updateState} />}
        {state.selectedView === "queue" && <PaymentQueue state={state} updateState={updateState} />}
        {state.selectedView === "tenants" && <TenantRecords state={state} updateState={updateState} />}
        {state.selectedView === "enabled" && <EnabledCustomers state={state} updateState={updateState} />}
        {state.selectedView === "devices" && <DeviceTracking state={state} updateState={updateState} />}
        {state.selectedView === "emails" && <EmailOutbox state={state} updateState={updateState} />}
        {state.selectedView === "settings" && <SettingsView state={state} updateState={updateState} />}
      </main>
    </div>
  );
}

function viewLabel(view) {
  return {
    register: "New Registration",
    trials: "Trial or Pending",
    queue: "Payment Queue",
    tenants: "Tenants",
    enabled: "Licences",
    devices: "Devices",
    emails: "Email Outbox",
    settings: "Portal Settings"
  }[view];
}

function viewTitle(view) {
  return {
    register: "Create company registration",
    trials: "Trial customers before payment queue",
    queue: "Verify payments and enable access",
    tenants: "Company tenant records",
    enabled: "Licence and subscription records",
    devices: "Device and app activations",
    emails: "Activation email drafts",
    settings: "Portal configuration"
  }[view];
}

function Stat({ label, value }) {
  return <article className="stat-card"><span>{label}</span><strong>{value}</strong></article>;
}

function RegistrationView({ state, updateState }) {
  function submit(event) {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget).entries());
    const registration = {
      id: nextRegistrationId(state.registrations),
      createdAt: todayIso(),
      ...data,
      paymentStatus: "Pending",
      stage: "Pending payment",
      activationCode: ""
    };

    updateState({
      ...state,
      selectedView: "queue",
      registrations: [registration, ...state.registrations]
    });
    event.currentTarget.reset();
  }

  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <h3>Registration and payment intake</h3>
          <p className="muted">Record the company setup request and payment reference. Payment is verified offline before the account is enabled.</p>
        </div>
      </div>
      <form className="entry-form" onSubmit={submit}>
        <div className="form-grid">
          <label>Company <input name="company" required placeholder="Test Corp Inc." /></label>
          <label>ACN / ABN, if applicable <input name="businessNumber" placeholder="Optional" /></label>
          <label>Contact name <input name="contactName" required placeholder="Jordan Smith" /></label>
          <label>Email <input name="email" type="email" required placeholder="admin@testcorp.com" /></label>
          <label>Phone <input name="phone" placeholder="+61 ..." /></label>
          <label>Plan <select name="plan">{plans.map((plan) => <option key={plan}>{plan}</option>)}</select></label>
          <label>Requested users <input name="requestedUsers" placeholder="25" /></label>
          <label>Payment method <select name="paymentMethod">{paymentMethods.map((method) => <option key={method}>{method}</option>)}</select></label>
          <label>Payment reference <input name="paymentReference" placeholder="PayPal / card / invoice reference" /></label>
          <label className="wide">Notes <textarea name="notes" placeholder="Payment details, sales notes or onboarding requirements." /></label>
        </div>
        <p className="muted">
          Current PayPal payment link: <a href={state.settings.paymentLink} target="_blank" rel="noreferrer">{state.settings.paymentLink}</a>
        </p>
        <p className="muted">
          Bank transfer: {state.settings.bankTransferDetails}
        </p>
        <button className="primary-button" type="submit">Add to payment queue</button>
      </form>
    </section>
  );
}

function trialMetrics(licence) {
  const trialStartDate = licence.trialStartDate || addDays(licence.trialEndDate || todayIso(), -30);
  const trialEndDate = licence.trialEndDate || addDays(trialStartDate, 30);
  const daysUsed = daysBetween(trialStartDate);
  const daysRemaining = Math.max(0, 30 - daysUsed);
  return { trialStartDate, trialEndDate, daysUsed, daysRemaining };
}

function TrialOrPendingView({ state, updateState }) {
  const trials = state.licences
    .filter((licence) => (licence.paymentStatus === "Trial" || licence.status === "Trial") && licence.paymentStatus !== "Pending")
    .map((licence) => ({
      licence,
      registration: state.registrations.find((item) => item.id === licence.registrationId) || licence,
      tenant: state.tenants.find((item) => item.id === licence.tenantId)
    }));

  function moveToPaymentQueue(licence) {
    const registration = state.registrations.find((item) => item.id === licence.registrationId) || licence;
    const queuedRegistration = {
      ...registration,
      stage: "Pending payment",
      paymentStatus: "Pending",
      tenantId: licence.tenantId,
      licenceId: licence.id,
      activationCode: licence.activationCode,
      trialEndDate: licence.trialEndDate
    };
    const registrationWithLicence = { ...queuedRegistration, licence };

    updateState({
      ...state,
      selectedView: "queue",
      registrations: state.registrations.some((item) => item.id === queuedRegistration.id)
        ? state.registrations.map((item) => (item.id === queuedRegistration.id ? queuedRegistration : item))
        : [queuedRegistration, ...state.registrations],
      licences: state.licences.map((item) =>
        item.id === licence.id ? { ...item, paymentStatus: "Pending", status: "Trial" } : item
      ),
      emails: [draftTrialPaymentRequiredEmail(registrationWithLicence, state.settings), ...state.emails]
    });
  }

  function deactivateTrial(licence) {
    const registration = state.registrations.find((item) => item.id === licence.registrationId) || licence;
    updateState({
      ...state,
      licences: state.licences.map((item) =>
        item.id === licence.id ? { ...item, status: "Expired", paymentStatus: "Expired" } : item
      ),
      tenants: state.tenants.map((item) =>
        item.id === licence.tenantId ? { ...item, status: "Expired", disabledAt: todayIso() } : item
      ),
      registrations: state.registrations.map((item) =>
        item.id === registration.id ? { ...item, stage: "Expired", paymentStatus: "Expired" } : item
      )
    });
  }

  if (!trials.length) {
    return (
      <section className="panel">
        <p className="muted">No active 30 day trial customers are currently waiting before the payment queue.</p>
      </section>
    );
  }

  return (
    <section className="panel">
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Company</th>
              <th>Contact</th>
              <th>Licence</th>
              <th>Trial start</th>
              <th>Trial end</th>
              <th>Days on trial</th>
              <th>Days remaining</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {trials.map(({ licence, registration, tenant }) => {
              const metrics = trialMetrics(licence);
              return (
                <tr key={licence.id}>
                  <td>{licence.company}<br /><small>{tenant?.status || "Tenant active"}</small></td>
                  <td>{licence.contactName}<br /><small>{licence.email}</small></td>
                  <td><strong>{licence.id}</strong><br /><small>{licence.registrationId}</small></td>
                  <td>{formatDate(metrics.trialStartDate)}</td>
                  <td>{formatDate(metrics.trialEndDate)}</td>
                  <td>{metrics.daysUsed}</td>
                  <td>{metrics.daysRemaining}</td>
                  <td>
                    <div className="action-row">
                      <button className="secondary-button" type="button" onClick={() => moveToPaymentQueue(licence)}>Move to payment queue</button>
                      <button className="danger-button" type="button" onClick={() => deactivateTrial(licence)}>Deactivate trial</button>
                    </div>
                    <small>{registration.notes || "Trial customer"}</small>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function PaymentQueue({ state, updateState }) {
  const queued = state.registrations.filter((item) => item.stage !== "Enabled");

  function approve(id, paymentStatus = "Paid") {
    const registration = state.registrations.find((item) => item.id === id);
    const activationCode = registration.activationCode || activationCodeFor(registration);
    const tenant = createTenant({ ...registration }, state.tenants);
    const licence = createLicence({ ...registration, activationCode }, tenant, state.licences, paymentStatus);
    const enabledTenant = { ...tenant, licenceId: licence.id, status: "Active", disabledAt: "" };
    const enabledRegistration = {
      ...registration,
      stage: "Enabled",
      paymentStatus,
      activationCode,
      tenantId: tenant.id,
      licenceId: licence.id
    };
    const activationEmail = draftEmail({ ...enabledRegistration, licence }, state.settings);
    const invoiceEmail = draftInvoiceEmail({ ...enabledRegistration, licence }, state.settings, paymentStatus);
    updateState({
      ...state,
      selectedView: "emails",
      registrations: state.registrations.map((item) => (item.id === id ? enabledRegistration : item)),
      tenants: [enabledTenant, ...state.tenants.filter((item) => item.id !== enabledTenant.id)],
      licences: [licence, ...state.licences.filter((item) => item.registrationId !== id)],
      emails: [activationEmail, invoiceEmail, ...state.emails]
    });
  }

  function approveTrial(id) {
    const registration = state.registrations.find((item) => item.id === id);
    const activationCode = registration.activationCode || activationCodeFor(registration);
    const tenant = createTenant({ ...registration }, state.tenants);
    const licence = createLicence({ ...registration, activationCode }, tenant, state.licences, "Trial");
    const enabledTenant = { ...tenant, licenceId: licence.id, status: "Active", disabledAt: "" };
    const enabledRegistration = {
      ...registration,
      stage: "Enabled",
      paymentStatus: "Trial",
      activationCode,
      tenantId: tenant.id,
      licenceId: licence.id,
      trialEndDate: licence.trialEndDate
    };
    const registrationWithLicence = { ...enabledRegistration, licence };
    updateState({
      ...state,
      selectedView: "emails",
      registrations: state.registrations.map((item) => (item.id === id ? enabledRegistration : item)),
      tenants: [enabledTenant, ...state.tenants.filter((item) => item.id !== enabledTenant.id)],
      licences: [licence, ...state.licences.filter((item) => item.registrationId !== id)],
      emails: [
        draftEmail(registrationWithLicence, state.settings),
        draftTrialNoticeEmail(registrationWithLicence, state.settings),
        draftTrialFollowUpEmail(registrationWithLicence, state.settings),
        ...state.emails
      ]
    });
  }

  function recordRefund(id) {
    const registration = state.registrations.find((item) => item.id === id);
    const refundedRegistration = {
      ...registration,
      stage: "Refunded",
      paymentStatus: "Refunded"
    };
    updateState({
      ...state,
      selectedView: "emails",
      registrations: state.registrations.map((item) => (item.id === id ? refundedRegistration : item)),
      emails: [draftRefundEmail(refundedRegistration, state.settings), ...state.emails]
    });
  }

  function setPaymentStatus(id, paymentStatus) {
    const stage =
      paymentStatus === "Rejected" || paymentStatus === "Expired" || paymentStatus === "Refunded"
        ? paymentStatus
        : "Pending payment";
    updateState({
      ...state,
      registrations: state.registrations.map((item) =>
        item.id === id ? { ...item, stage, paymentStatus } : item
      )
    });
  }

  return (
    <section className="panel">
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Reg #</th>
              <th>Company</th>
              <th>ACN / ABN</th>
              <th>Contact</th>
              <th>Payment</th>
              <th>Payment status</th>
              <th>Stage</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {queued.map((item) => (
              <tr key={item.id}>
                <td>{formatDate(item.createdAt)}</td>
                <td><strong>{item.id}</strong></td>
                <td>{item.company}</td>
                <td>{item.businessNumber || "-"}</td>
                <td>{item.contactName}</td>
                <td>{item.paymentMethod}<br /><small>{item.paymentReference || "No reference"}</small></td>
                <td>
                  <select
                    aria-label={`Payment status for ${item.id}`}
                    value={item.paymentStatus}
                    onChange={(event) => setPaymentStatus(item.id, event.target.value)}
                  >
                    {paymentStatuses.map((status) => <option key={status}>{status}</option>)}
                  </select>
                </td>
                <td><span className={`pill ${statusClass(item.stage)}`}>{item.stage}</span></td>
                <td>
                  <div className="action-row">
                    <button className="secondary-button" type="button" onClick={() => approve(item.id, "Paid")}>Approve paid</button>
                    <button className="secondary-button" type="button" onClick={() => approve(item.id, "Waived")}>Approve waived</button>
                    <button className="secondary-button" type="button" onClick={() => approveTrial(item.id)}>Approve 30-day trial</button>
                    <button className="secondary-button" type="button" onClick={() => recordRefund(item.id)}>Record refund</button>
                    <button className="danger-button" type="button" onClick={() => setPaymentStatus(item.id, "Rejected")}>Reject</button>
                    <button className="secondary-button" type="button" onClick={() => setPaymentStatus(item.id, "Expired")}>Expire</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function TenantRecords({ state, updateState }) {
  function updateTenantStatus(id, status) {
    const disabledAt = status === "Active" ? "" : todayIso();
    updateState({
      ...state,
      tenants: state.tenants.map((item) => (item.id === id ? { ...item, status, disabledAt } : item)),
      licences: state.licences.map((item) =>
        item.tenantId === id ? { ...item, status: status === "Active" ? "Active" : status } : item
      ),
      devices: state.devices.map((item) =>
        item.tenantId === id && status !== "Active" ? { ...item, status: "Revoked" } : item
      )
    });
  }

  return (
    <section className="record-grid">
      {state.tenants.map((tenant) => (
        <article className="record-card" key={tenant.id}>
          <span className={`pill ${statusClass(tenant.status)}`}>{tenant.status}</span>
          <h3>{tenant.company}</h3>
          <div className="record-meta">
            <span><strong>Tenant:</strong> {tenant.id}</span>
            <span><strong>ACN / ABN:</strong> {tenant.businessNumber || "-"}</span>
            <span><strong>Primary contact:</strong> {tenant.primaryContact}</span>
            <span><strong>Email:</strong> {tenant.email}</span>
            <span><strong>Licence:</strong> {tenant.licenceId}</span>
            <span><strong>Created:</strong> {formatDate(tenant.createdAt)}</span>
            {tenant.disabledAt && <span><strong>Disabled:</strong> {formatDate(tenant.disabledAt)}</span>}
          </div>
          <label>
            Tenant status
            <select value={tenant.status} onChange={(event) => updateTenantStatus(tenant.id, event.target.value)}>
              {tenantStatuses.map((status) => <option key={status}>{status}</option>)}
            </select>
          </label>
        </article>
      ))}
    </section>
  );
}

function EnabledCustomers({ state, updateState }) {
  const enabled = state.licences;

  function updateLicenceStatus(id, status) {
    updateState({
      ...state,
      licences: state.licences.map((item) => (item.id === id ? { ...item, status } : item)),
      tenants: state.tenants.map((item) =>
        item.licenceId === id ? { ...item, status: status === "Active" || status === "Trial" ? "Active" : status } : item
      ),
      devices: state.devices.map((item) =>
        item.licenceId === id && (status === "Suspended" || status === "Expired" || status === "Cancelled")
          ? { ...item, status: "Revoked" }
          : item
      )
    });
  }

  function redraft(licence) {
    const registration = state.registrations.find((item) => item.id === licence.registrationId) || licence;
    updateState({
      ...state,
      selectedView: "emails",
      emails: [
        draftEmail({ ...registration, licence }, state.settings),
        draftInvoiceEmail({ ...registration, licence }, state.settings, licence.paymentStatus),
        ...state.emails
      ]
    });
  }

  return (
    <section className="record-grid">
      {enabled.map((item) => (
        <article className="record-card" key={item.id}>
          <span className={`pill ${statusClass(item.status)}`}>{item.status}</span>
          <h3>{item.company}</h3>
          <div className="record-meta">
            <span><strong>Tenant:</strong> {item.tenantId}</span>
            <span><strong>Licence:</strong> {item.id}</span>
            <span><strong>Registration:</strong> {item.registrationId}</span>
            <span><strong>ACN / ABN:</strong> {item.businessNumber || "-"}</span>
            <span><strong>Contact:</strong> {item.contactName}</span>
            <span><strong>Email:</strong> {item.email}</span>
            <span><strong>Plan:</strong> {item.plan}</span>
            <span><strong>User limit:</strong> {item.userLimit}</span>
            {item.trialEndDate && <span><strong>Trial ends:</strong> {formatDate(item.trialEndDate)}</span>}
            <span><strong>Start:</strong> {formatDate(item.startDate)}</span>
            <span><strong>Renewal:</strong> {formatDate(item.renewalDate)}</span>
            <span><strong>Payment:</strong> {item.paymentStatus}</span>
            <span><strong>Activation:</strong> {item.activationCode}</span>
          </div>
          <label>
            Licence status
            <select value={item.status} onChange={(event) => updateLicenceStatus(item.id, event.target.value)}>
              {licenceStatuses.map((status) => <option key={status}>{status}</option>)}
            </select>
          </label>
          <button className="secondary-button" type="button" onClick={() => redraft(item)}>Draft email again</button>
        </article>
      ))}
    </section>
  );
}

function draftEmail(registration, settings) {
  const emailSettings = { ...settings, downloadLink: appAccessLink(settings.downloadLink) };
  return {
    id: `EMAIL-${Date.now()}`,
    registrationId: registration.id,
    to: registration.email,
    subject: "SHEQBuddy app access and activation code",
    body: emailBody(registration, emailSettings),
    stage: "Drafted",
    createdAt: todayIso()
  };
}

function draftInvoiceEmail(registration, settings, paymentStatus = "Paid") {
  return {
    id: `EMAIL-${Date.now()}-INV`,
    registrationId: registration.id,
    to: routedRecipients(registration, settings),
    subject: `SHEQBuddy tax invoice ${invoiceNumberFor(registration)} - ${registration.company}`,
    body: invoiceBody(registration, settings, paymentStatus),
    stage: "Drafted",
    createdAt: todayIso()
  };
}

function draftTrialNoticeEmail(registration, settings) {
  return {
    id: `EMAIL-${Date.now()}-TRIAL`,
    registrationId: registration.id,
    to: routedRecipients(registration, settings),
    subject: `SHEQBuddy 30 day trial started - ${registration.company}`,
    body: trialNoticeBody(registration, settings),
    stage: "Drafted",
    createdAt: todayIso()
  };
}

function draftTrialFollowUpEmail(registration, settings) {
  const trialStartDate = registration.licence?.trialStartDate || todayIso();
  return {
    id: `EMAIL-${Date.now()}-TRIAL-FOLLOWUP`,
    registrationId: registration.id,
    to: routedRecipients(registration, settings),
    subject: `SHEQBuddy trial reminder - 10 days remaining - ${registration.company}`,
    body: trialFollowUpBody(registration, settings),
    stage: "Drafted",
    createdAt: addDays(trialStartDate, 20)
  };
}

function draftTrialPaymentRequiredEmail(registration, settings) {
  return {
    id: `EMAIL-${Date.now()}-TRIAL-PAYMENT`,
    registrationId: registration.id,
    to: routedRecipients(registration, settings),
    subject: `SHEQBuddy trial ending - payment required - ${registration.company}`,
    body: trialPaymentRequiredBody(registration, settings),
    stage: "Drafted",
    createdAt: todayIso()
  };
}

function draftRefundEmail(registration, settings) {
  return {
    id: `EMAIL-${Date.now()}-REFUND`,
    registrationId: registration.id,
    to: routedRecipients(registration, settings),
    subject: `SHEQBuddy refund recorded - ${registration.company}`,
    body: refundBody(registration, settings),
    stage: "Drafted",
    createdAt: todayIso()
  };
}

function createTenant(registration, existingTenants) {
  const existing = existingTenants.find((item) => item.company.toLowerCase() === registration.company.toLowerCase());
  if (existing) {
    return { ...existing, status: "Active", disabledAt: "" };
  }
  return {
    id: nextTenantId(existingTenants),
    company: registration.company,
    primaryContact: registration.contactName,
    businessNumber: registration.businessNumber || "",
    email: registration.email,
    status: "Active",
    licenceId: "",
    createdAt: todayIso(),
    disabledAt: "",
    notes: registration.notes || ""
  };
}

function createLicence(registration, tenant, existingLicences, paymentStatus = "Paid") {
  const trialStartDate = paymentStatus === "Trial" ? todayIso() : "";
  const trialEndDate = paymentStatus === "Trial" ? addDays(trialStartDate, 30) : "";
  const startDate = paymentStatus === "Trial" ? trialEndDate : todayIso();
  const id = nextLicenceId(existingLicences);
  return {
    id,
    tenantId: tenant.id,
    registrationId: registration.id,
    company: registration.company,
    businessNumber: registration.businessNumber || "",
    contactName: registration.contactName,
    email: registration.email,
    plan: registration.plan,
    userLimit: registration.requestedUsers || planUserLimit(registration.plan),
    status: paymentStatus === "Waived" || paymentStatus === "Trial" ? "Trial" : "Active",
    paymentStatus,
    activationCode: registration.activationCode,
    trialStartDate,
    trialEndDate,
    startDate,
    renewalDate: addYears(startDate, 1)
  };
}

function nextTenantId(tenants) {
  const highest = tenants.reduce((max, item) => {
    const number = Number(item.id.replace(/\D/g, ""));
    return Number.isFinite(number) ? Math.max(max, number) : max;
  }, 0);
  return `TEN-${String(highest + 1).padStart(4, "0")}`;
}

function nextLicenceId(licences) {
  const highest = licences.reduce((max, item) => {
    const number = Number(item.id.replace(/\D/g, ""));
    return Number.isFinite(number) ? Math.max(max, number) : max;
  }, 0);
  return `LIC-${String(highest + 1).padStart(4, "0")}`;
}

function planUserLimit(plan) {
  if (plan.includes("Starter")) return "10";
  if (plan.includes("Business")) return "50";
  return "Custom";
}

function DeviceTracking({ state, updateState }) {
  function submit(event) {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget).entries());
    const licence = state.licences.find((item) => item.id === data.licenceId);
    const device = {
      id: nextDeviceId(state.devices),
      tenantId: licence?.tenantId || "",
      licenceId: data.licenceId,
      userName: data.userName,
      platform: data.platform,
      deviceName: data.deviceName,
      activationDate: todayIso(),
      lastSync: todayIso(),
      status: "Active"
    };
    updateState({ ...state, devices: [device, ...state.devices] });
    event.currentTarget.reset();
  }

  function revoke(id) {
    updateState({
      ...state,
      devices: state.devices.map((item) => (item.id === id ? { ...item, status: "Revoked" } : item))
    });
  }

  return (
    <section className="view-stack">
      <section className="panel">
        <div className="panel-heading">
          <div>
            <h3>Record device activation</h3>
            <p className="muted">Tracks devices that have activated the app against a licence. In production this will be populated by the activation API.</p>
          </div>
        </div>
        <form className="entry-form" onSubmit={submit}>
          <div className="form-grid">
            <label>Licence <select name="licenceId">{state.licences.map((item) => <option key={item.id}>{item.id}</option>)}</select></label>
            <label>User <input name="userName" required placeholder="Avery Morgan" /></label>
            <label>Platform <select name="platform">{platforms.map((item) => <option key={item}>{item}</option>)}</select></label>
            <label>Device name <input name="deviceName" required placeholder="Avery laptop" /></label>
          </div>
          <button className="primary-button" type="submit">Add device activation</button>
        </form>
      </section>

      <section className="record-grid">
        {state.devices.map((device) => (
          <article className="record-card" key={device.id}>
            <span className={`pill ${statusClass(device.status)}`}>{device.status}</span>
            <h3>{device.deviceName}</h3>
            <div className="record-meta">
              <span><strong>Device:</strong> {device.id}</span>
              <span><strong>Tenant:</strong> {device.tenantId}</span>
              <span><strong>Licence:</strong> {device.licenceId}</span>
              <span><strong>User:</strong> {device.userName}</span>
              <span><strong>Platform:</strong> {device.platform}</span>
              <span><strong>Activated:</strong> {formatDate(device.activationDate)}</span>
              <span><strong>Last sync:</strong> {formatDate(device.lastSync)}</span>
            </div>
            <button className="danger-button" type="button" onClick={() => revoke(device.id)}>Revoke device</button>
          </article>
        ))}
      </section>
    </section>
  );
}

function nextDeviceId(devices) {
  const highest = devices.reduce((max, item) => {
    const number = Number(item.id.replace(/\D/g, ""));
    return Number.isFinite(number) ? Math.max(max, number) : max;
  }, 0);
  return `DEV-${String(highest + 1).padStart(4, "0")}`;
}

function EmailOutbox({ state, updateState }) {
  function markSent(id) {
    updateState({
      ...state,
      emails: state.emails.map((item) => (item.id === id ? { ...item, stage: "Sent" } : item))
    });
  }

  return (
    <section className="email-list">
      {state.emails.map((item) => (
        <article className="email-card" key={item.id}>
          <span className={`pill ${statusClass(item.stage)}`}>{item.stage}</span>
          <h3>{item.subject}</h3>
          <span>To: {item.to}</span>
          <small>Registration: {item.registrationId} | {formatDate(item.createdAt)}</small>
          <div className="email-body">{item.body}</div>
          <div className="action-row">
            <button className="secondary-button" type="button" onClick={() => navigator.clipboard?.writeText(`${item.subject}\n\n${item.body}`)}>Copy email</button>
            <button className="secondary-button" type="button" onClick={() => markSent(item.id)}>Mark sent</button>
          </div>
        </article>
      ))}
    </section>
  );
}

function SettingsView({ state, updateState }) {
  function submit(event) {
    event.preventDefault();
    const settings = Object.fromEntries(new FormData(event.currentTarget).entries());
    updateState({
      ...state,
      settings: { ...settings, downloadLink: appAccessLink(settings.downloadLink) }
    });
  }

  return (
    <section className="panel">
      <form className="entry-form" onSubmit={submit}>
        <div className="form-grid">
          <label>App access link <input name="downloadLink" defaultValue={appAccessLink(state.settings.downloadLink)} /></label>
          <label>Demo app link <input name="demoLink" defaultValue={state.settings.demoLink} /></label>
          <label>Payment portal name <input name="paymentPortalName" defaultValue={state.settings.paymentPortalName} /></label>
          <label>Payment link <input name="paymentLink" defaultValue={state.settings.paymentLink} /></label>
          <label>Sample invoice link <input name="sampleInvoiceLink" defaultValue={state.settings.sampleInvoiceLink || SAMPLE_INVOICE_URL} /></label>
          <label>Bank transfer details <input name="bankTransferDetails" defaultValue={state.settings.bankTransferDetails} /></label>
          <label>Admin email <input name="adminEmail" type="email" defaultValue={state.settings.adminEmail} /></label>
          <label>Support email <input name="supportEmail" type="email" defaultValue={state.settings.supportEmail} /></label>
          <label className="wide">Email footer <textarea name="emailFooter" defaultValue={state.settings.emailFooter} /></label>
        </div>
        <button className="primary-button" type="submit">Save settings</button>
      </form>
    </section>
  );
}

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
