import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Wallet, Smartphone, KeyRound, Info, ArrowRight, RefreshCw, CheckCircle2 } from 'lucide-react-native';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { authApi, getErrorMessage } from '../lib/api';
import { useAuth } from '../lib/auth';

export default function LoginScreen() {
  const router = useRouter();
  const { login, isAuthenticated } = useAuth();

  // If already authenticated, redirect immediately
  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, router]);

  const [step, setStep] = useState<'PHONE' | 'OTP'>('PHONE');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [otpError, setOtpError] = useState('');
  const [serverError, setServerError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Resend cooldown timer
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (cooldown > 0) {
      timer = setTimeout(() => setCooldown((prev) => prev - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [cooldown]);

  const validatePhone = (num: string): boolean => {
    const clean = num.replace(/\D/g, '');
    if (!clean) {
      setPhoneError('Phone number is required');
      return false;
    }
    if (!/^[6-9]\d{9}$/.test(clean)) {
      setPhoneError('Enter a valid 10-digit Indian phone number starting with 6-9');
      return false;
    }
    setPhoneError('');
    return true;
  };

  const handleSendOtp = async () => {
    setServerError('');
    setSuccessMessage('');
    if (!validatePhone(phone)) return;

    setIsLoading(true);
    try {
      const cleanPhone = phone.replace(/\D/g, '');
      const response = await authApi.sendOtp(cleanPhone);
      setSuccessMessage(response.message || 'OTP sent! Check backend console.');
      setCooldown(response.cooldownSeconds || 30);
      setStep('OTP');
    } catch (err) {
      setServerError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setServerError('');
    setOtpError('');
    const cleanOtp = otp.trim();

    if (!cleanOtp) {
      setOtpError('Please enter the 6-digit OTP');
      return;
    }

    if (!/^\d{6}$/.test(cleanOtp)) {
      setOtpError('OTP must be exactly 6 digits');
      return;
    }

    setIsLoading(true);
    try {
      const cleanPhone = phone.replace(/\D/g, '');
      const response = await authApi.verifyOtp(cleanPhone, cleanOtp);
      await login(response.token, response.user);
      router.replace('/(tabs)');
    } catch (err) {
      setServerError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header & Logo */}
          <View style={styles.header}>
            <View style={styles.logoBadge}>
              <Wallet size={36} color="#0F172A" />
            </View>
            <Text style={styles.appName}>MiniLedger</Text>
            <Text style={styles.tagline}>Track loans given to friends without the awkwardness</Text>
          </View>

          {/* Login Card */}
          <Card variant="elevated" style={styles.card}>
            <Text style={styles.cardTitle}>
              {step === 'PHONE' ? 'Sign in with Mobile' : 'Verify OTP'}
            </Text>
            <Text style={styles.cardSubtitle}>
              {step === 'PHONE'
                ? 'Enter your 10-digit Indian phone number to receive a verification code.'
                : `Enter the 6-digit code sent for +91 ${phone}`}
            </Text>

            {/* Error Message */}
            {serverError ? (
              <View style={styles.errorBanner}>
                <Text style={styles.errorBannerText}>{serverError}</Text>
              </View>
            ) : null}

            {/* Success Message */}
            {successMessage ? (
              <View style={styles.successBanner}>
                <CheckCircle2 size={16} color="#047857" style={{ marginRight: 6 }} />
                <Text style={styles.successBannerText}>{successMessage}</Text>
              </View>
            ) : null}

            {step === 'PHONE' ? (
              <View style={styles.formSection}>
                <Input
                  label="Mobile Number"
                  prefix="+91"
                  placeholder="9876543210"
                  keyboardType="phone-pad"
                  maxLength={10}
                  value={phone}
                  onChangeText={(text) => {
                    setPhone(text.replace(/\D/g, ''));
                    if (phoneError) setPhoneError('');
                  }}
                  error={phoneError}
                  leftIcon={<Smartphone size={18} color="#64748B" />}
                />

                <Button
                  title="Send Verification Code"
                  onPress={handleSendOtp}
                  isLoading={isLoading}
                  disabled={phone.length < 10}
                  icon={<ArrowRight size={18} color="#FFFFFF" />}
                  style={styles.submitBtn}
                />
              </View>
            ) : (
              <View style={styles.formSection}>
                <Input
                  label="6-Digit OTP"
                  placeholder="123456"
                  keyboardType="number-pad"
                  maxLength={6}
                  value={otp}
                  onChangeText={(text) => {
                    setOtp(text.replace(/\D/g, ''));
                    if (otpError) setOtpError('');
                  }}
                  error={otpError}
                  leftIcon={<KeyRound size={18} color="#64748B" />}
                />

                <Button
                  title="Verify & Continue"
                  onPress={handleVerifyOtp}
                  isLoading={isLoading}
                  disabled={otp.length !== 6}
                  style={styles.submitBtn}
                />

                <View style={styles.otpActions}>
                  <TouchableOpacity
                    onPress={handleSendOtp}
                    disabled={cooldown > 0 || isLoading}
                    style={styles.resendButton}
                  >
                    <RefreshCw
                      size={14}
                      color={cooldown > 0 ? '#94A3B8' : '#0F172A'}
                      style={{ marginRight: 4 }}
                    />
                    <Text
                      style={[
                        styles.resendText,
                        cooldown > 0 && styles.resendDisabled,
                      ]}
                    >
                      {cooldown > 0 ? `Resend OTP in ${cooldown}s` : 'Resend OTP'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => {
                      setStep('PHONE');
                      setOtp('');
                      setOtpError('');
                      setServerError('');
                      setSuccessMessage('');
                    }}
                    style={styles.changePhoneButton}
                  >
                    <Text style={styles.changePhoneText}>Change Number</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Mock OTP Helper Notice */}
            <View style={styles.mockNotice}>
              <Info size={16} color="#1E293B" style={{ marginTop: 2, marginRight: 8 }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.mockNoticeTitle}>Developer / Mock OTP Mode</Text>
                <Text style={styles.mockNoticeText}>
                  No SMS provider is needed. Check your backend server terminal to view the 6-digit OTP printed in the logs.
                </Text>
              </View>
            </View>
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 28,
  },
  logoBadge: {
    width: 68,
    height: 68,
    borderRadius: 20,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  appName: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: 20,
  },
  card: {
    padding: 24,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 20,
    lineHeight: 20,
  },
  formSection: {
    width: '100%',
  },
  submitBtn: {
    marginTop: 8,
  },
  otpActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 18,
    paddingHorizontal: 4,
  },
  resendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  resendText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
  },
  resendDisabled: {
    color: '#94A3B8',
  },
  changePhoneButton: {
    paddingVertical: 6,
  },
  changePhoneText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  errorBanner: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  errorBannerText: {
    color: '#B91C1C',
    fontSize: 13,
    fontWeight: '500',
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  successBannerText: {
    color: '#065F46',
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  mockNotice: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 12,
    marginTop: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  mockNoticeTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 2,
  },
  mockNoticeText: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 16,
  },
});
