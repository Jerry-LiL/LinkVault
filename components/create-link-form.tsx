export function CreateLinkForm() {
  return (
    <form className="card form" action="/api/links" method="post">
      <div className="fields">
        <label>
          Destination
          <input
            name="destination"
            type="url"
            required
            placeholder="https://example.com/docs/getting-started"
            autoComplete="off"
          />
        </label>
        <label>
          Custom slug
          <input name="slug" placeholder="handbook" autoCapitalize="none" autoCorrect="off" />
          <span className="hint">Optional. Leave blank and one is chosen for you.</span>
        </label>
        <label>
          Expiry (UTC)
          <input name="expiresAt" type="datetime-local" />
          <span className="hint">Optional. After this moment the link stops redirecting.</span>
        </label>
      </div>
      <label>
        Title
        <input name="title" maxLength={80} placeholder="Docs" />
      </label>
      <div>
        <button type="submit">Create short link</button>
      </div>
    </form>
  );
}
