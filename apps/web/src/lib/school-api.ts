export async function fetchSchoolList(apiUrl: string, token: string, path: "students" | "teachers" | "classes") {
  const res = await fetch(`${apiUrl}/school/${path}`, { headers: { Authorization: `Bearer ${token}` } });
  return res.json();
}
