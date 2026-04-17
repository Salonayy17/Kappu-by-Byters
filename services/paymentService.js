/**
 * Mock UPI/payment simulation
 */
const triggerUPIPayment = async (upiId, amount) => {
    return new Promise(resolve => {
        setTimeout(() => {
            console.log(`[PaymentService] ₹${amount} successfully transferred to ${upiId}`);
            resolve({ success: true, txnId: 'PAY' + Date.now() });
        }, 1000);
    });
};

module.exports = { triggerUPIPayment };
