import { useState } from 'react'
import SectionCard from '../components/SectionCard'
import { useCampaignStore } from '../store/campaign'
import { useAction } from './useAction'
import { passwordProblem, usernameProblem } from './username'

/** Signed in but no username yet (it was taken or invalid at sign-up). */
export function ChooseUsername() {
    const setUsername = useCampaignStore((state) => state.setUsername)
    const [value, setValue] = useState('')
    const action = useAction()

    return (
        <SectionCard title="Choose your username">
            <p>Other players see this name in campaigns.</p>
            <form
                onSubmit={(event) => {
                    event.preventDefault()
                    void action.run(() => setUsername(value))
                }}
            >
                <label>
                    Username
                    <input value={value} maxLength={20} onChange={(event) => setValue(event.target.value)} />
                    {value !== '' && usernameProblem(value) && <small className="roll-error">{usernameProblem(value)}</small>}
                </label>
                <button className="primary-button" type="submit" disabled={action.busy || usernameProblem(value) !== null}>
                    Save username
                </button>
                {action.error && <p className="roll-error">{action.error}</p>}
            </form>
        </SectionCard>
    )
}

/** Arrived from the password reset email. */
export function ChooseNewPassword() {
    const finishRecovery = useCampaignStore((state) => state.finishRecovery)
    const [password, setPassword] = useState('')
    const [again, setAgain] = useState('')
    const action = useAction()

    return (
        <SectionCard title="Choose a new password">
            <form
                onSubmit={(event) => {
                    event.preventDefault()
                    void action.run(() => finishRecovery(password))
                }}
            >
                <label>
                    New password
                    <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" />
                    {password !== '' && passwordProblem(password) && <small className="roll-error">{passwordProblem(password)}</small>}
                </label>
                <label>
                    Repeat it
                    <input type="password" value={again} onChange={(event) => setAgain(event.target.value)} autoComplete="new-password" />
                </label>
                <button
                    className="primary-button"
                    type="submit"
                    disabled={action.busy || passwordProblem(password) !== null || password !== again}
                >
                    Save new password
                </button>
                {action.error && <p className="roll-error">{action.error}</p>}
            </form>
        </SectionCard>
    )
}

/** The signed-in strip, with sign out and account settings. */
export function AccountBar() {
    const account = useCampaignStore((state) => state.account)
    const { signOut, switchAccountHere, setUsername, changePassword } = useCampaignStore.getState()
    const [open, setOpen] = useState(false)
    const [name, setName] = useState(account?.username ?? '')
    const [password, setPassword] = useState('')
    const [message, setMessage] = useState('')
    const rename = useAction()
    const repass = useAction()

    if (!account) return null

    return (
        <div className="account-bar">
            <div>
                Signed in as <strong>{account.username ?? 'no username yet'}</strong>
                {account.email && <small className="muted"> ({account.email})</small>}
            </div>
            <div className="actions inline-actions">
                <button className="secondary-button" type="button" onClick={() => setOpen(!open)}>
                    Account
                </button>
                <button className="secondary-button" type="button" onClick={() => void signOut()}>
                    Sign out
                </button>
                <button className="secondary-button" type="button" onClick={switchAccountHere} title="Sign in to a different account in this tab, without signing out your other tabs">
                    Use another account in this tab
                </button>
            </div>

            {open && (
                <div className="account-settings">
                    <form
                        onSubmit={async (event) => {
                            event.preventDefault()
                            const ok = await rename.run(async () => (await setUsername(name), true))
                            if (ok) setMessage('Username saved.')
                        }}
                    >
                        <label>
                            Username
                            <input value={name} maxLength={20} onChange={(event) => setName(event.target.value)} />
                        </label>
                        <button className="secondary-button" type="submit" disabled={rename.busy || usernameProblem(name) !== null || name.trim() === account.username}>
                            Change username
                        </button>
                        {rename.error && <p className="roll-error">{rename.error}</p>}
                    </form>

                    <form
                        onSubmit={async (event) => {
                            event.preventDefault()
                            const ok = await repass.run(async () => (await changePassword(password), true))
                            if (ok) {
                                setPassword('')
                                setMessage('Password changed.')
                            }
                        }}
                    >
                        <label>
                            New password
                            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" />
                        </label>
                        <button className="secondary-button" type="submit" disabled={repass.busy || passwordProblem(password) !== null}>
                            Change password
                        </button>
                        {repass.error && <p className="roll-error">{repass.error}</p>}
                    </form>
                    {message && <p className="status-message" role="status">{message}</p>}
                </div>
            )}
        </div>
    )
}
