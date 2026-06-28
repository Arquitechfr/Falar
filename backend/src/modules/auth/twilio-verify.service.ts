import twilio from 'twilio';
import crypto from 'crypto';
import { env } from '../../config/env.js';

const client = twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);

function hashPhoneNumber(phoneNumber: string): string {
  return crypto
    .createHash('sha256')
    .update(phoneNumber)
    .digest('hex')
    .substring(0, 16);
}

export async function sendTwilioOtp(phoneNumber: string): Promise<{ success: boolean; verificationSid?: string; error?: string }> {
  try {
    const verification = await client.verify.v2
      .services(env.TWILIO_VERIFY_SERVICE_SID)
      .verifications.create({
        channel: 'sms',
        to: phoneNumber,
      });

    const phoneHash = hashPhoneNumber(phoneNumber);
    console.log(`[Twilio] OTP envoyé à ${phoneHash}... (SID: ${verification.sid})`);
    
    return {
      success: true,
      verificationSid: verification.sid,
    };
  } catch (err) {
    const phoneHash = hashPhoneNumber(phoneNumber);
    const errorMessage = (err as Error).message;
    console.error(`[Twilio] Erreur envoi OTP pour ${phoneHash}...: ${errorMessage}`);
    
    return {
      success: false,
      error: errorMessage,
    };
  }
}

export async function verifyTwilioOtp(phoneNumber: string, code: string): Promise<{ success: boolean; error?: string }> {
  try {
    const verificationCheck = await client.verify.v2
      .services(env.TWILIO_VERIFY_SERVICE_SID)
      .verificationChecks.create({
        to: phoneNumber,
        code: code,
      });

    const phoneHash = hashPhoneNumber(phoneNumber);
    
    if (verificationCheck.status === 'approved') {
      console.log(`[Twilio] Code validé pour ${phoneHash}...`);
      return {
        success: true,
      };
    } else {
      console.log(`[Twilio] Code invalide pour ${phoneHash}... (statut: ${verificationCheck.status})`);
      return {
        success: false,
        error: `Code invalide (statut: ${verificationCheck.status})`,
      };
    }
  } catch (err) {
    const phoneHash = hashPhoneNumber(phoneNumber);
    const errorMessage = (err as Error).message;
    console.error(`[Twilio] Erreur vérification OTP pour ${phoneHash}...: ${errorMessage}`);
    
    return {
      success: false,
      error: errorMessage,
    };
  }
}
