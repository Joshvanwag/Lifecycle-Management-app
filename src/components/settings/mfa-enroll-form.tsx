"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function MfaEnrollForm() {
  const [qr, setQr] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function startEnroll() {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const supabase = createClient();
      const { data, error: enrollError } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: "Authenticator app",
      });
      if (enrollError) throw enrollError;
      setFactorId(data.id);
      setQr(data.totp.qr_code);
      setSecret(data.totp.secret);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not start MFA enrollment.");
    } finally {
      setBusy(false);
    }
  }

  async function verify() {
    if (!factorId) return;
    setBusy(true);
    setError(null);
    try {
      const supabase = createClient();
      const challenge = await supabase.auth.mfa.challenge({ factorId });
      if (challenge.error) throw challenge.error;
      const verified = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challenge.data.id,
        code: code.trim(),
      });
      if (verified.error) throw verified.error;
      setMessage("Authenticator app enrolled. Use it the next time you sign in.");
      setQr(null);
      setSecret(null);
      setCode("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "That code was not accepted.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Two-factor authentication</CardTitle>
        <CardDescription>
          Optional TOTP enrollment with an authenticator app. This does not enable SSO or change
          organization login policy.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!qr && (
          <Button type="button" onClick={startEnroll} disabled={busy}>
            Enroll authenticator
          </Button>
        )}
        {qr && (
          <div className="space-y-3">
            <img src={qr} alt="Authenticator QR code" className="h-40 w-40" />
            {secret && (
              <p className="text-xs text-muted-foreground">
                If you cannot scan, enter this secret: {secret}
              </p>
            )}
            <div className="space-y-2">
              <Label htmlFor="mfaCode">Confirmation code</Label>
              <Input
                id="mfaCode"
                inputMode="numeric"
                value={code}
                onChange={(event) => setCode(event.target.value)}
                className="max-w-xs"
              />
            </div>
            <Button type="button" onClick={verify} disabled={busy || code.trim().length < 6}>
              Confirm enrollment
            </Button>
          </div>
        )}
        {message && <p className="text-sm text-green-700">{message}</p>}
        {error && <p className="text-sm text-destructive">{error}</p>}
      </CardContent>
    </Card>
  );
}
