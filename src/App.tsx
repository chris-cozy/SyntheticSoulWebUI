import SyntheticSoul from "./SyntheticSoul";

export default function App() {
  // external API call — adjust to your endpoint + auth
  const ask = async (input: string): Promise<string> => {
    const res = await fetch(`${import.meta.env.VITE_SYNTHETIC_SOUL_CHAT_URL}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message: input, username: import.meta.env.VITE_SYNTHETIC_SOUL_GUEST_USER, type: import.meta.env.VITE_SYNTHETIC_SOUL_DM_TYPE}),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`HTTP ${res.status} – ${text}`);
    }
    const data = await res.json();
    // Expecting { response: string } from your API
    return data.response ?? String(data);
  };

  return <SyntheticSoul onAsk={ask} title="JASMINE" />;
}
