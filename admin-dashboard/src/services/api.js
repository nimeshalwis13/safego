const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

export async function registerAdmin(adminData) {
  const response = await fetch(`${BASE_URL}/api/admin/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(adminData)
  });
  
  const result = await response.json();
  
  if (!response.ok) {
    throw new Error(result.error || "Registration failed");
  }
  
  return result;
}

export async function loginAdmin(credentials) {
  const response = await fetch(`${BASE_URL}/api/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials)
  });
  
  const result = await response.json();
  
  if (!response.ok) {
    throw new Error(result.error || "Login failed");
  }
  
  // Store token in localStorage
  localStorage.setItem("adminToken", result.token);
  
  return result;
}

export async function getAdminProfile() {
  const token = localStorage.getItem("adminToken");
  
  const response = await fetch(`${BASE_URL}/api/admin/profile`, {
    headers: { 
      "Authorization": `Bearer ${token}`
    }
  });
  
  const result = await response.json();
  
  if (!response.ok) {
    throw new Error(result.error || "Failed to get profile");
  }
  
  return result;
}

export async function generateSeatsForBus({ busID, totalSeats }) {
  const response = await fetch(`${BASE_URL}/api/seats/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ busID, totalSeats })
  });
  
  const result = await response.json();
  
  if (!response.ok) {
    throw new Error(result.error || result.message || "Failed to generate seats");
  }
  
  return result;
}

export function logout() {
  localStorage.removeItem("adminToken");
}

// Route Management Functions
export async function createRoute(routeData) {
  const token = localStorage.getItem("adminToken");
  
  const response = await fetch(`${BASE_URL}/api/routes`, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify(routeData)
  });
  
  const result = await response.json();
  
  if (!response.ok) {
    throw new Error(result.error || "Failed to create route");
  }
  
  return result;
}

export async function getAllRoutes() {
  const token = localStorage.getItem("adminToken");
  
  const response = await fetch(`${BASE_URL}/api/routes`, {
    headers: { 
      "Authorization": `Bearer ${token}`
    }
  });
  
  const result = await response.json();
  
  if (!response.ok) {
    throw new Error(result.error || "Failed to fetch routes");
  }
  
  return result;
}

export async function updateRoute(routeId, routeData) {
  const token = localStorage.getItem("adminToken");
  
  const response = await fetch(`${BASE_URL}/api/routes/${routeId}`, {
    method: "PUT",
    headers: { 
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify(routeData)
  });
  
  const result = await response.json();
  
  if (!response.ok) {
    throw new Error(result.error || "Failed to update route");
  }
  
  return result;
}

export async function deleteRoute(routeId) {
  const token = localStorage.getItem("adminToken");
  
  const response = await fetch(`${BASE_URL}/api/routes/${routeId}`, {
    method: "DELETE",
    headers: { 
      "Authorization": `Bearer ${token}`
    }
  });
  
  const result = await response.json();
  
  if (!response.ok) {
    throw new Error(result.error || "Failed to delete route");
  }
  
  return result;
}

// Waitlist Management Functions
export async function getAllWaitlists() {
  const token = localStorage.getItem("adminToken");
  
  const response = await fetch(`${BASE_URL}/api/waitlist/admin/all`, {
    headers: { 
      "Authorization": `Bearer ${token}`
    }
  });
  
  const result = await response.json();
  
  if (!response.ok) {
    throw new Error(result.error || "Failed to fetch waitlists");
  }
  
  return result;
}

export async function cancelWaitlistEntry(waitlistID) {
  const token = localStorage.getItem("adminToken");
  
  const response = await fetch(`${BASE_URL}/api/waitlist/${encodeURIComponent(waitlistID)}`, {
    method: "DELETE",
    headers: { 
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ adminCancel: true })
  });
  
  const result = await response.json();
  
  if (!response.ok) {
    throw new Error(result.error || result.message || "Failed to cancel waitlist entry");
  }
  
  return result;
}

export async function notifyNextInWaitlist(busID) {
  const token = localStorage.getItem("adminToken");
  
  const response = await fetch(`${BASE_URL}/api/waitlist/notify-next/${encodeURIComponent(busID)}`, {
    method: "POST",
    headers: { 
      "Authorization": `Bearer ${token}`
    }
  });
  
  const result = await response.json();
  
  if (!response.ok) {
    throw new Error(result.error || result.message || "Failed to notify next person");
  }
  
  return result;
}