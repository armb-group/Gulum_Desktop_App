import { useState } from "react";
import { forgotPasswordApi } from "@/services/authApi";
import { toast } from "sonner";

const ForgotPassword = () => {
    const [step, setStep] = useState(1);
    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const handleEmailSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await forgotPasswordApi(email);
            toast.success("OTP sent to your email!");
            setStep(2);
        } catch (err: any) {
            toast.error(err?.response?.data?.message ?? "Failed to send OTP.");
        } finally {
            setLoading(false);
        }
    };

    const handleResetSubmit = (e: React.FormEvent) => {
        e.preventDefault();
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
            <div className="w-full max-w-md bg-white shadow-lg rounded-2xl p-8">

                {step === 1 ? (
                    <>
                        <h2 className="text-3xl font-bold text-center text-gray-800 mb-2">
                            Forgot Password
                        </h2>

                        <p className="text-center text-gray-500 mb-6">
                            Enter your email to receive OTP
                        </p>

                        <form onSubmit={handleEmailSubmit} className="space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Email
                                </label>

                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Enter your email"
                                    required
                                    className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white py-3 rounded-xl font-semibold transition duration-300"
                            >
                                {loading ? "Sending..." : "Send OTP"}
                            </button>
                        </form>
                    </>
                ) : (
                    <>
                        <h2 className="text-3xl font-bold text-center text-gray-800 mb-2">
                            Reset Password
                        </h2>

                        <p className="text-center text-gray-500 mb-6">
                            Enter OTP and new password
                        </p>

                        <form onSubmit={handleResetSubmit} className="space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    6 Digit OTP
                                </label>

                                <input
                                    type="text"
                                    maxLength={6}
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
                                    placeholder="Enter OTP"
                                    required
                                    className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    New Password
                                </label>

                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="Enter new password"
                                    required
                                    className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <button
                                type="submit"
                                className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-semibold transition duration-300"
                            >
                                Reset Password
                            </button>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
};

export default ForgotPassword;
