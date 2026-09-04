import React, { useState, useEffect } from 'react';
import { useSubscription } from '@/src/context/SubscriptionContext.tsx';
import { Check, Star, Zap, Crown, Loader2, ArrowRight } from 'lucide-react';

export const SubscriptionView: React.FC = () => {
  const { entitlements, billing, availablePlans, isLoading, checkoutPlan, grantEarlyAccess, grantLifetimePartner } = useSubscription();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'success' | 'cancelled' | 'failed' | 'error' | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const payment = params.get('payment');
    if (payment) {
      setPaymentStatus(payment as any);
      // Clean up URL without refreshing
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  const handleUpgrade = async (planId: string) => {
    setIsProcessing(true);
    try {
      await checkoutPlan(planId, billingCycle);
    } catch (e: any) {
      console.error(e);
      alert(`Failed to initiate checkout: ${e.message}`);
      setIsProcessing(false);
    }
  };

  const getPlanIcon = (name: string) => {
    if (name.toLowerCase().includes('free')) return <Star className="w-5 h-5 text-slate-400" />;
    if (name.toLowerCase().includes('premium')) return <Zap className="w-5 h-5 text-amber-500" />;
    return <Crown className="w-5 h-5 text-indigo-500" />;
  };

  const getEarlyAccessText = () => {
    if (!billing?.earlyAccessExpiresAt) return null;
    const expiry = new Date(billing.earlyAccessExpiresAt);
    const now = new Date();
    if (expiry < now) return 'Early access expired';
    
    const daysRemaining = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return `Early access: ${daysRemaining} days remaining (expires ${expiry.toLocaleDateString()})`;
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      
      {paymentStatus && (
        <div className={`p-4 rounded-xl border ${
          paymentStatus === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 
          paymentStatus === 'cancelled' ? 'bg-amber-50 border-amber-200 text-amber-800' :
          'bg-rose-50 border-rose-200 text-rose-800'
        }`}>
          <div className="flex items-center gap-2 font-bold">
            {paymentStatus === 'success' && <Check className="w-5 h-5" />}
            {paymentStatus === 'success' && 'Payment Successful!'}
            {paymentStatus === 'cancelled' && 'Payment Cancelled'}
            {(paymentStatus === 'failed' || paymentStatus === 'error') && 'Payment Failed or Encounetered an Error'}
          </div>
          <p className="text-sm mt-1">
            {paymentStatus === 'success' && 'Your subscription has been updated. You now have access to all premium features.'}
            {paymentStatus === 'cancelled' && 'You cancelled the checkout process. Your plan remains unchanged.'}
            {(paymentStatus === 'failed' || paymentStatus === 'error') && 'There was an issue processing your payment. Please try again or contact support.'}
          </p>
        </div>
      )}

      {/* Current Plan Overview */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              Current Plan: <span className="text-indigo-600">{availablePlans.find(p => p.id === entitlements?.planId)?.name || 'Unknown'}</span>
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              {entitlements?.specialAccess?.length ? (
                <span className="flex flex-col gap-1">
                  <span className="flex items-center gap-2">
                    Special Access Granted: <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 font-semibold rounded uppercase text-[10px] tracking-wider">{entitlements.specialAccess.join(', ')}</span>
                  </span>
                  {billing?.earlyAccessExpiresAt && (
                    <span className="text-emerald-600 font-medium">
                      {getEarlyAccessText()}
                    </span>
                  )}
                </span>
              ) : (
                billing?.status === 'active' 
                  ? `Active subscription. Next billing on ${billing.nextBillingDate}`
                  : 'You are currently on the free tier.'
              )}
            </p>
          </div>
          
          <div className="flex items-center gap-4 text-sm">
            <div className="bg-slate-50 px-4 py-2 rounded-lg border border-slate-100">
              <span className="block text-slate-500 text-xs mb-0.5">Cover Exports</span>
              <span className="font-bold text-slate-900">{entitlements?.limits.coverExports} / mo</span>
            </div>
            <div className="bg-slate-50 px-4 py-2 rounded-lg border border-slate-100">
              <span className="block text-slate-500 text-xs mb-0.5">AI Credits</span>
              <span className="font-bold text-slate-900">{entitlements?.limits.aiCredits} / mo</span>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing Header */}
      <div className="text-center space-y-4 pt-8">
        <h1 className="text-3xl font-bold text-slate-900">Simple, transparent pricing</h1>
        <p className="text-slate-500 max-w-xl mx-auto">
          Scale your KDP publishing business with tools designed for serious authors. No hidden fees. Change or cancel anytime.
        </p>

        {/* Toggle */}
        <div className="flex items-center justify-center pt-4">
          <div className="bg-slate-100 p-1 rounded-xl inline-flex items-center">
            <button 
              onClick={() => setBillingCycle('monthly')}
              className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${billingCycle === 'monthly' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
            >
              Monthly
            </button>
            <button 
              onClick={() => setBillingCycle('yearly')}
              className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${billingCycle === 'yearly' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
            >
              Yearly
              <span className={`px-2 py-0.5 rounded text-[10px] uppercase tracking-wider font-bold ${billingCycle === 'yearly' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>Save 20%</span>
            </button>
          </div>
        </div>
      </div>

      {/* Pricing Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
        {availablePlans.map((plan) => (
          <div key={plan.id} className={`bg-white rounded-2xl border ${entitlements?.planId === plan.id ? 'border-indigo-500 shadow-md ring-1 ring-indigo-500' : 'border-slate-200 shadow-sm'} p-6 flex flex-col`}>
            <div className="mb-4 flex items-center gap-2">
              {getPlanIcon(plan.name)}
              <h3 className="text-lg font-bold text-slate-900">{plan.name}</h3>
            </div>
            
            <div className="mb-6 flex items-end gap-2">
              <span className="text-4xl font-bold text-slate-900">
                ${billingCycle === 'yearly' ? (plan.yearlyPriceUSD / 12).toFixed(2) : plan.monthlyPriceUSD}
              </span>
              <span className="text-sm text-slate-500 font-medium mb-1">/ mo</span>
            </div>
            {billingCycle === 'yearly' && plan.yearlyPriceUSD > 0 && (
              <p className="text-sm text-emerald-600 font-medium mb-6 mt-[-16px]">Billed ${plan.yearlyPriceUSD} yearly</p>
            )}

            <button 
              onClick={() => handleUpgrade(plan.id)}
              disabled={isProcessing || entitlements?.planId === plan.id}
              className={`w-full py-3 px-4 rounded-xl font-semibold transition flex items-center justify-center gap-2 ${
                entitlements?.planId === plan.id
                  ? 'bg-indigo-50 text-indigo-700 cursor-default'
                  : 'bg-slate-900 text-white hover:bg-slate-800'
              }`}
            >
              {isProcessing && entitlements?.planId !== plan.id ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : entitlements?.planId === plan.id ? (
                'Current Plan'
              ) : (
                'Select Plan'
              )}
            </button>

            <div className="mt-8 space-y-4 flex-1">
              <h4 className="text-sm font-bold text-slate-900 tracking-wide uppercase">Plan Features</h4>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-indigo-500 shrink-0" />
                  <span className="text-sm text-slate-600"><strong>{plan.limits.keywordSearches}</strong> keyword searches / mo</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-indigo-500 shrink-0" />
                  <span className="text-sm text-slate-600"><strong>{plan.limits.nicheQueries}</strong> niche queries / mo</span>
                </li>
                <li className={`flex items-start gap-3 ${!plan.features.canExportCover && 'opacity-50'}`}>
                  <Check className={`w-5 h-5 shrink-0 ${plan.features.canExportCover ? 'text-indigo-500' : 'text-slate-300'}`} />
                  <span className="text-sm text-slate-600">{plan.features.canExportCover ? <strong>{plan.limits.coverExports} Cover exports</strong> : 'No cover exports'}</span>
                </li>
                <li className={`flex items-start gap-3 ${!plan.features.aiAssistant && 'opacity-50'}`}>
                  <Check className={`w-5 h-5 shrink-0 ${plan.features.aiAssistant ? 'text-indigo-500' : 'text-slate-300'}`} />
                  <span className="text-sm text-slate-600">{plan.features.aiAssistant ? <strong>{plan.limits.aiCredits} AI Assistant credits</strong> : 'No AI Assistant'}</span>
                </li>
              </ul>
            </div>
          </div>
        ))}
      </div>

      {/* Admin/Partner Tools (Visible for demo purposes) */}
      <div className="mt-12 bg-slate-50 border border-slate-200 rounded-2xl p-6">
        <h3 className="text-lg font-bold text-slate-900 mb-2">Developer Tools / System Simulations</h3>
        <p className="text-sm text-slate-500 mb-6">Simulate backend admin actions such as granting early access or approving lifetime partner accounts.</p>
        
        <div className="flex flex-wrap gap-4">
          <button 
            onClick={async () => {
              setIsProcessing(true);
              try {
                await grantEarlyAccess(30);
              } catch (e) {
                alert('Failed to grant early access');
              } finally {
                setIsProcessing(false);
              }
            }}
            disabled={isProcessing}
            className="bg-indigo-100 text-indigo-700 hover:bg-indigo-200 px-4 py-2 rounded-lg text-sm font-semibold transition"
          >
            Simulate: Grant 30-Day Premium Early Access
          </button>
          
          <button 
            onClick={async () => {
              setIsProcessing(true);
              try {
                await grantLifetimePartner();
              } catch (e) {
                alert('Failed to grant lifetime partner access');
              } finally {
                setIsProcessing(false);
              }
            }}
            disabled={isProcessing}
            className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 px-4 py-2 rounded-lg text-sm font-semibold transition"
          >
            Simulate: Grant Lifetime Partner Access
          </button>
        </div>

        {billing?.auditLog && billing.auditLog.length > 0 && (
          <div className="mt-8 border-t border-slate-200 pt-6">
            <h4 className="text-sm font-bold text-slate-900 mb-4">Audit Log</h4>
            <div className="space-y-3">
              {billing.auditLog.map((log: any, i: number) => (
                <div key={i} className="flex gap-4 text-sm bg-white p-3 rounded-lg border border-slate-100 shadow-sm">
                  <span className="text-slate-400 whitespace-nowrap">{new Date(log.date).toLocaleString()}</span>
                  <div>
                    <span className="font-semibold text-slate-700 mr-2">{log.action}</span>
                    <span className="text-slate-500">{log.details}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

    </div>
  );
};
