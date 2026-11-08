import { useState } from "react";
import { useFinance } from "../context/FinanceContext";

async function preparePortrait(file) {
  if (!["image/png","image/jpeg","image/webp"].includes(file.type) || file.size > 8*1024*1024)
    throw new Error("Choose a JPG, PNG or WebP image under 8 MB.");
  const bitmap = await createImageBitmap(file);
  try {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 256;
    const size = Math.min(bitmap.width,bitmap.height);
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#fff"; ctx.fillRect(0,0,256,256);
    ctx.drawImage(bitmap,(bitmap.width-size)/2,(bitmap.height-size)/2,size,size,0,0,256,256);
    return canvas.toDataURL("image/jpeg",.86);
  } finally { bitmap.close(); }
}

export default function Profile() {
  const { currentUser, workspaceUsers, saveProfile, deleteAccount } = useFinance();
  const [avatar,setAvatar] = useState(currentUser.avatar);
  const [email,setEmail] = useState(currentUser.email);
  const [deleting,setDeleting] = useState(false);
  const [loading,setLoading] = useState(false);
  const [message,setMessage] = useState("");
  const others = workspaceUsers.filter(member => member.id !== currentUser.id);
  const transfer = others.length > 0 && !others.some(member => member.role === "admin");
  async function save(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const result = await saveProfile({...Object.fromEntries(new FormData(form)),avatar});
    setMessage(result.success ? "Profile saved." : result.message);
  }
  return <section className="planning-desk"><header className="overview-heading"><div><p className="ledger-label">Workspace membership</p><h1>Profile <em>card.</em></h1></div></header>
    <div className="profile-layout"><aside className="identity-card">
      <div className="identity-photo">{avatar ? <img src={avatar} alt="Profile portrait" /> : currentUser.name.slice(0,1).toUpperCase()}</div>
      <h2>{currentUser.name}</h2><p>{currentUser.title || currentUser.role}</p>
      <div className="identity-foot">LedgerView <span>Member {String(currentUser.id).padStart(4,"0")}</span></div>
    </aside>
    <section className="desk-panel"><h2>Personal details</h2>
      <form onSubmit={save}>
        <label>Name<input required name="name" defaultValue={currentUser.name} maxLength={200} /></label>
        <label>Job title<input name="title" defaultValue={currentUser.title} maxLength={100} /></label>
        <label>Email<input required name="email" type="email" value={email} onChange={e => setEmail(e.target.value)} /></label>
        {email.trim().toLowerCase() !== currentUser.email && <label>Current password<input required autoComplete="current-password" name="password" type="password" /></label>}
        <label>Profile picture<input type="file" accept="image/png,image/jpeg,image/webp" disabled={loading} onChange={async event => {
          const file = event.target.files[0]; if (!file) return;
          setLoading(true); try { setAvatar(await preparePortrait(file)); setMessage(""); }
          catch (error) { setMessage(error.message); } finally { setLoading(false); }
        }} /></label>
        {avatar && <button type="button" onClick={() => setAvatar("")}>Remove picture</button>}
        <button className="finova-action-button" disabled={loading}>Save profile</button>
      </form><p role="status">{message}</p>
    </section></div>
    <section className="desk-panel"><header><h2>Account deletion</h2><button onClick={() => setDeleting(!deleting)}>{deleting ? "Cancel deletion" : "Delete account"}</button></header>
      {deleting && <form onSubmit={async event => {
        event.preventDefault(); const draft = Object.fromEntries(new FormData(event.currentTarget));
        const result = await deleteAccount(draft); if (!result.success) setMessage(result.message);
      }}><p>{others.length ? "Your account and sessions will be deleted. Other members will keep the shared ledger." : "You are the only member. Deleting your account permanently deletes this workspace and its financial records."}</p>
        {!others.length && <label><span><input required type="checkbox" name="deleteWorkspace" value="yes" /> Delete this workspace and its records</span></label>}
        {transfer && <label>New administrator<select required name="successor" defaultValue=""><option value="" disabled>Select a member</option>{others.map(m => <option key={m.id} value={m.id}>{m.name} ({m.email})</option>)}</select></label>}
        <label>Confirm current password<input required type="password" autoComplete="current-password" name="password" /></label>
        <button className="finova-action-button finova-action-button--danger">Permanently delete my account</button></form>}
    </section></section>;
}

