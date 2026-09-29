import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import SectionCard from '../components/SectionCard'
import { useCampaignStore } from '../store/campaign'
import { useAction } from './useAction'
import { getBackend } from './backend'
import { emailProblem, passwordProblem, usernameProblem } from './username'

function KeepSignedIn({ checked, onChange }: { checked: boolean; onChange: (value: boolean) => void }) {
    return (
        <label className="inline-check keep-signed-in">
            <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
            <span>
                Keep me signed in on this device
                {!checked && (
                    <small className="muted">
                        {' '}
                        This tab only: you are signed out when you close it, and another tab can be a different account. Handy for
                        playing two characters at once.
                    </small>
                )}
            </span>
        </label>
    )
}

function SignInForm({ onForgot }: { onForgot: (email: string) => void }) {
    const signIn = useCampaignStore((state) => state.signIn)
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [keep, setKeep] = useState(true)
    const action = useAction()

    const submit = (event: FormEvent) => {
        event.preventDefault()
        void action.run(() => signIn(email, password, keep ? 'device' : 'tab'))
    }

    return (
        <form onSubmit={submit}>
            <label>
                Email
                <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" />
            </label>
            <label>
                Password
                <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" />
            </label>
            <KeepSignedIn checked={keep} onChange={setKeep} />
            <div className="actions inline-actions">
                <button className="primary-button" type="submit" disabled={action.busy || emailProblem(email) !== null || password === ''}>
                    Sign in
                </button>
                <button className="link-button" type="button" onClick={() => onForgot(email)}>
                    Forgot your password?
                </button>
            </div>
            {action.error && <p className="roll-error">{action.error}</p>}
        </form>
    )
}

function CreateAccountForm() {
    const signUp = useCampaignStore((state) => state.signUp)
    const [email, setEmail] = useState('')
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [again, setAgain] = useState('')
    const [keep, setKeep] = useState(true)
    const [free, setFree] = useState<boolean | null>(null)
    const [confirmEmail, setConfirmEmail] = useState(false)
    const action = useAction()

    // Ask the database whether the username is free, shortly after typing stops.
    useEffect(() => {
        setFree(null)
        if (usernameProblem(username) !== null) return
        const timer = window.setTimeout(() => {
            void getBackend()
                .usernameAvailable(username)
                .then(setFree)
                .catch(() => setFree(null))
        }, 450)
        return () => window.clearTimeout(timer)
    }, [username])

    const problems = {
        email: email === '' ? null : emailProblem(email),
        username: username === '' ? null : usernameProblem(username),
        password: password === '' ? null : passwordProblem(password),
        again: again !== '' && again !== password ? 'The passwords do not match.' : null,
    }
    const ready =
        emailProblem(email) === null &&
        usernameProblem(username) === null &&
        free !== false &&
        passwordProblem(password) === null &&
        password === again

    const submit = async (event: FormEvent) => {
        event.preventDefault()
        const result = await action.run(() => signUp({ email, password, username }, keep ? 'device' : 'tab'))
        if (result === 'confirm-email') setConfirmEmail(true)
    }

    if (confirmEmail) {
        return (
            <div className="status-message" role="status">
                <p>
                    Almost done. We sent a confirmation link to <strong>{email}</strong>. Open it, then come back here and sign in.
                </p>
            </div>
        )
    }

    return (
        <form onSubmit={submit}>
            <label>
                Email
                <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" />
                {problems.email && <small className="roll-error">{problems.email}</small>}
            </label>
            <label>
                Username (what other players see)
                <input value={username} maxLength={20} onChange={(event) => setUsername(event.target.value)} autoComplete="nickname" />
                {problems.username && <small className="roll-error">{problems.username}</small>}
                {!problems.username && username !== '' && free === true && <small className="username-free">That name is free.</small>}
                {!problems.username && free === false && <small className="roll-error">That username is taken.</small>}
            </label>
            <label>
                Password
                <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" />
                {problems.password && <small className="roll-error">{problems.password}</small>}
            </label>
            <label>
                Repeat the password
                <input type="password" value={again} onChange={(event) => setAgain(event.target.value)} autoComplete="new-password" />
                {problems.again && <small className="roll-error">{problems.again}</small>}
            </label>
            <KeepSignedIn checked={keep} onChange={setKeep} />
            <button className="primary-button" type="submit" disabled={!ready || action.busy}>
                Create account
            </button>
            {action.error && <p className="roll-error">{action.error}</p>}
        </form>
    )
}

function ForgotPassword({ startEmail, onDone }: { startEmail: string; onDone: () => void }) {
    const [email, setEmail] = useState(startEmail)
    const [sent, setSent] = useState(false)
    const action = useAction()

    const submit = async (event: FormEvent) => {
        event.preventDefault()
        const ok = await action.run(async () => {
            await getBackend().requestPasswordReset(email)
            return true
        })
        if (ok) setSent(true)
    }

    return sent ? (
        <div className="status-message" role="status">
            <p>If there is an account for {email}, a reset link is on its way. Open it on this device to choose a new password.</p>
            <button className="secondary-button" type="button" onClick={onDone}>
                Back to sign in
            </button>
        </div>
    ) : (
        <form onSubmit={submit}>
            <label>
                Email for your account
                <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" />
            </label>
            <div className="actions inline-actions">
                <button className="primary-button" type="submit" disabled={action.busy || emailProblem(email) !== null}>
                    Send reset link
                </button>
                <button className="link-button" type="button" onClick={onDone}>
                    Cancel
                </button>
            </div>
            {action.error && <p className="roll-error">{action.error}</p>}
        </form>
    )
}

/** Shown when nobody is signed in. */
export function AccountGate() {
    const [mode, setMode] = useState<'signin' | 'create' | 'forgot'>('signin')
    const [forgotEmail, setForgotEmail] = useState('')

    return (
        <SectionCard title={mode === 'create' ? 'Create your account' : mode === 'forgot' ? 'Reset your password' : 'Sign in to play'}>
            {mode !== 'forgot' && (
                <div className="builder-tabs" role="tablist">
                    <button type="button" role="tab" aria-selected={mode === 'signin'} className={mode === 'signin' ? 'active' : ''} onClick={() => setMode('signin')}>
                        Sign in
                    </button>
                    <button type="button" role="tab" aria-selected={mode === 'create'} className={mode === 'create' ? 'active' : ''} onClick={() => setMode('create')}>
                        Create account
                    </button>
                </div>
            )}

            {mode === 'signin' && (
                <SignInForm
                    onForgot={(email) => {
                        setForgotEmail(email)
                        setMode('forgot')
                    }}
                />
            )}
            {mode === 'create' && <CreateAccountForm />}
            {mode === 'forgot' && <ForgotPassword startEmail={forgotEmail} onDone={() => setMode('signin')} />}

            <p className="muted">
                Your account lets you open your campaigns from any device. Your characters are saved on the device you make them on.
            </p>
        </SectionCard>
    )
}
