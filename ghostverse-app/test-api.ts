async function test() {
  console.log("Testing Register...");
  const username = "apiuser_" + Date.now();
  const password = "Password123!";
  
  const regRes = await fetch("http://localhost:3000/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password, displayName: "API User" }),
  });
  
  const regData = await regRes.json();
  console.log("Register:", regRes.status, regData);
  
  console.log("Testing Login...");
  const loginRes = await fetch("http://localhost:3000/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  
  const loginData = await loginRes.json();
  console.log("Login:", loginRes.status, loginData);
}

test().catch(console.error);
