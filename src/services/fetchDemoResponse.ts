/*
  src/services/fetchDemoResponse.ts
  Used by the frontend for the public demo (reads sample_response.json when VITE_USE_MOCK=true)
*/
export async function fetchDemoResponse(prompt: string) {
  try {
    const useMock = import.meta.env.VITE_USE_MOCK === 'true';
    if (useMock) {
      const res = await fetch('/sample_response.json');
      if (!res.ok) throw new Error('Failed to load sample response');
      const data = await res.json();
      // attach prompt so UI can show the input used
      (data as any).example_prompt_used = prompt;
      return data;
    } else {
      // Real API call branch (won't run on public demo).
      const res = await fetch('/api/runModel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });
      return await res.json();
    }
  } catch (err) {
    console.error('fetchDemoResponse error', err);
    return { error: (err as any)?.message ?? String(err) };
  }
}
