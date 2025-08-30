import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  CreditCard,
  Smartphone,
  Bitcoin,
  Upload,
} from "lucide-react";
import { PageLayout } from "../components/layout/PageLayout";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { InputField } from "../components/ui/InputField";
import { FileUpload } from "../components/ui/FileUpload";
import { useToast } from "../components/ui/ToastNotification";
import { formatCurrency } from "../lib/mock-data";
import { wallet } from "../lib/api";

interface PaymentMethod {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  minAmount: number;
  maxAmount: number;
  processingTime: string;
  requiresReceipt: boolean;
}

const paymentMethods: PaymentMethod[] = [
  {
    id: "cbe",
    name: "CBE Bank",
    icon: <CreditCard size={24} />,
    description: "Commercial Bank of Ethiopia",
    minAmount: 10,
    maxAmount: 50000,
    processingTime: "1-3 business days",
    requiresReceipt: true,
  },
  {
    id: "awash",
    name: "Awash Bank",
    icon: <CreditCard size={24} />,
    description: "Awash International Bank",
    minAmount: 10,
    maxAmount: 50000,
    processingTime: "1-3 business days",
    requiresReceipt: true,
  },
  {
    id: "telebirr",
    name: "Telebirr",
    icon: <Smartphone size={24} />,
    description: "Ethiopian digital payment service",
    minAmount: 5,
    maxAmount: 25000,
    processingTime: "Instant",
    requiresReceipt: true,
  },
];

const DepositScreen: React.FC = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(
    null,
  );
  const [amount, setAmount] = useState("");
  const [receipt, setReceipt] = useState<File | null>(null);
  const [transactionRef, setTransactionRef] = useState("");
  const [senderName, setSenderName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [balance, setBalance] = React.useState<number>(0);

  React.useEffect(() => {
    (async () => {
      try {
        const w: any = await wallet.get();
        setBalance(w.balance || 0);
      } catch (e) {}
    })();
  }, []);

  const handleSubmit = async () => {
    if (!selectedMethod || !amount) return;

    const depositAmount = parseFloat(amount);
    if (
      depositAmount < selectedMethod.minAmount ||
      depositAmount > selectedMethod.maxAmount
    ) {
      addToast({
        type: "error",
        title: "Invalid Amount",
        message: `Amount must be between ${formatCurrency(selectedMethod.minAmount)} and ${formatCurrency(selectedMethod.maxAmount)}`,
      });
      return;
    }

    if (!transactionRef.trim()) {
      addToast({
        type: "error",
        title: "Transaction Reference Required",
        message: "Please enter the transaction reference number",
      });
      return;
    }

    if (!senderName.trim()) {
      addToast({
        type: "error",
        title: "Sender Name Required",
        message: "Please enter the sender full name",
      });
      return;
    }

    if (!receipt) {
      addToast({
        type: "error",
        title: "Payment Proof Required",
        message: "Please upload proof of payment (screenshot or receipt)",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // build multipart form data with file and metadata
      const fd = new FormData();
      fd.append("amount", depositAmount.toString());
      fd.append("method", selectedMethod.id);
      fd.append("transactionRef", transactionRef);
      fd.append("senderName", senderName);
      if (receipt) fd.append("paymentProof", receipt, receipt.name);

      const resp: any = await wallet.deposit(fd);
      // server returns a pending transaction
      addToast({
        type: "success",
        title: "Successfully deposited",
        message: "Successfully deposited wallet will Update soon",
      });
      navigate("/wallet");
    } catch (err: any) {
      const message =
        err?.body?.error ||
        err?.body?.message ||
        (err?.body
          ? JSON.stringify(err.body)
          : err.message || "Deposit failed");
      addToast({ type: "error", title: "Deposit Failed", message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const quickAmounts = [50, 100, 250, 500, 1000];

  return (
    <PageLayout>
      <div className="page-container space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-3 pt-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-lg bg-kiya-surface hover:bg-gray-700 transition-colors"
          >
            <ArrowLeft size={20} className="text-kiya-text" />
          </button>
          <h1 className="text-xl font-bold text-kiya-text">Deposit Funds</h1>
        </div>

        {/* Current Balance */}
        <Card>
          <div className="text-center">
            <p className="text-kiya-text-secondary text-sm mb-1">
              Current Balance
            </p>
            <p className="text-2xl font-bold text-kiya-text">
              {formatCurrency(balance)}
            </p>
          </div>
        </Card>

        {/* Payment Methods */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-kiya-text">
            Choose Payment Method
          </h2>
          <div className="space-y-3">
            {paymentMethods.map((method) => (
              <Card
                key={method.id}
                className={`cursor-pointer transition-all ${
                  selectedMethod?.id === method.id
                    ? "ring-2 ring-kiya-teal border-kiya-teal bg-kiya-teal/5"
                    : "hover:border-kiya-teal/50"
                }`}
                onClick={() => setSelectedMethod(method)}
              >
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-kiya-dark rounded-lg flex items-center justify-center">
                    <div className="text-kiya-teal">{method.icon}</div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-kiya-text mb-1">
                      {method.name}
                    </h3>
                    <p className="text-sm text-kiya-text-secondary mb-2">
                      {method.description}
                    </p>
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="text-kiya-text-secondary">
                          Limits:{" "}
                        </span>
                        <span className="text-kiya-text">
                          {formatCurrency(method.minAmount)} -{" "}
                          {formatCurrency(method.maxAmount)}
                        </span>
                      </div>
                      <div>
                        <span className="text-kiya-text-secondary">
                          Processing:{" "}
                        </span>
                        <span className="text-kiya-text">
                          {method.processingTime}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    <div
                      className={`w-5 h-5 rounded-full border-2 ${
                        selectedMethod?.id === method.id
                          ? "border-kiya-teal bg-kiya-teal"
                          : "border-gray-400"
                      }`}
                    >
                      {selectedMethod?.id === method.id && (
                        <div className="w-full h-full rounded-full bg-white scale-50"></div>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Amount Input */}
        {selectedMethod && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-kiya-text">
              Enter Amount
            </h3>

            <InputField
              label="Deposit Amount (ETB)"
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              helperText={`Min: ${formatCurrency(selectedMethod.minAmount)} | Max: ${formatCurrency(selectedMethod.maxAmount)}`}
            />

            {/* Quick Amount Buttons */}
            <div className="space-y-2">
              <p className="text-sm text-kiya-text-secondary">Quick amounts:</p>
              <div className="flex flex-wrap gap-2">
                {quickAmounts
                  .filter(
                    (amt) =>
                      amt >= selectedMethod.minAmount &&
                      amt <= selectedMethod.maxAmount,
                  )
                  .map((quickAmount) => (
                    <button
                      key={quickAmount}
                      onClick={() => setAmount(quickAmount.toString())}
                      className="px-3 py-2 rounded-lg bg-kiya-surface border border-gray-600 text-kiya-text text-sm hover:border-kiya-teal transition-colors"
                    >
                      {formatCurrency(quickAmount)}
                    </button>
                  ))}
              </div>
            </div>

            {/* Required Transaction Details */}
            <div className="space-y-4">
              <InputField
                label="Transaction Reference Number *"
                placeholder="Enter transaction reference from your receipt"
                value={transactionRef}
                onChange={(e) => setTransactionRef(e.target.value)}
                helperText="This is the reference number from your bank receipt or Telebirr confirmation"
              />

              <InputField
                label="Sender Full Name *"
                placeholder="Full name of the person who sent the money"
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
                helperText="Must match the name on the bank account or Telebirr account"
              />
            </div>

            {/* Receipt Upload */}
            <div className="space-y-2">
              <h4 className="font-medium text-kiya-text">
                Upload Payment Proof *
              </h4>
              <p className="text-sm text-kiya-text-secondary mb-3">
                Upload a clear photo of your bank receipt or Telebirr
                confirmation SMS
              </p>
              <FileUpload
                onFileSelect={setReceipt}
                accept="image/*"
                maxSizeMB={5}
              />
            </div>

            {/* Payment Instructions */}
            <Card className="bg-kiya-teal/5 border-kiya-teal/20">
              <h4 className="font-medium text-kiya-text mb-2">
                Payment Instructions for {selectedMethod.name}
              </h4>
              {selectedMethod.id === "cbe" && (
                <div className="text-sm text-kiya-text-secondary space-y-1">
                  <p>• Bank: Commercial Bank of Ethiopia (CBE)</p>
                  <p>
                    • Account Number:{" "}
                    <strong className="text-kiya-text">10001212121</strong>
                  </p>
                  <p>• Account Name: Kiya Lottery PLC</p>
                  <p>• Make sure to keep your receipt for verification</p>
                </div>
              )}
              {selectedMethod.id === "awash" && (
                <div className="text-sm text-kiya-text-secondary space-y-1">
                  <p>• Bank: Awash International Bank</p>
                  <p>
                    • Account Number:{" "}
                    <strong className="text-kiya-text">12121212</strong>
                  </p>
                  <p>• Account Name: Kiya Lottery PLC</p>
                  <p>• Make sure to keep your receipt for verification</p>
                </div>
              )}
              {selectedMethod.id === "telebirr" && (
                <div className="text-sm text-kiya-text-secondary space-y-1">
                  <p>
                    • Send money to:{" "}
                    <strong className="text-kiya-text">0912345689</strong>
                  </p>
                  <p>• Account Name: Kiya Lottery</p>
                  <p>• Use your phone number as reference</p>
                  <p>• Save the confirmation SMS for proof</p>
                </div>
              )}
            </Card>

            {/* Summary */}
            {amount &&
              parseFloat(amount) > 0 &&
              transactionRef &&
              senderName && (
                <Card className="bg-kiya-dark">
                  <h4 className="font-medium text-kiya-text mb-3">
                    Deposit Summary
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-kiya-text-secondary">Amount:</span>
                      <span className="text-kiya-text font-medium">
                        {formatCurrency(parseFloat(amount))}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-kiya-text-secondary">Method:</span>
                      <span className="text-kiya-text">
                        {selectedMethod.name}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-kiya-text-secondary">
                        Transaction Ref:
                      </span>
                      <span className="text-kiya-text font-mono">
                        {transactionRef}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-kiya-text-secondary">
                        Sender Name:
                      </span>
                      <span className="text-kiya-text">{senderName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-kiya-text-secondary">
                        Processing Time:
                      </span>
                      <span className="text-kiya-text">
                        {selectedMethod.processingTime}
                      </span>
                    </div>
                    <div className="border-t border-gray-600 pt-2">
                      <div className="flex justify-between">
                        <span className="text-kiya-text font-medium">
                          New Balance:
                        </span>
                        <span className="text-kiya-teal font-bold">
                          {formatCurrency(balance + parseFloat(amount))}
                        </span>
                      </div>
                    </div>
                  </div>
                </Card>
              )}

            {/* Submit Button */}
            <Button
              variant="primary"
              size="full"
              onClick={handleSubmit}
              loading={isSubmitting}
              disabled={
                !amount ||
                parseFloat(amount) < selectedMethod.minAmount ||
                parseFloat(amount) > selectedMethod.maxAmount ||
                !transactionRef.trim() ||
                !senderName.trim() ||
                !receipt
              }
            >
              Submit Deposit Request
            </Button>
          </div>
        )}
      </div>
    </PageLayout>
  );
};

export default DepositScreen;
