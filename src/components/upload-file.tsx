"use client";

export default function Upload() {
  async function upload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });
  }

  return (
    <form onSubmit={upload}>
      <input type="file" name="file" />
      <button type="submit">Upload</button>
    </form>
  );
}
