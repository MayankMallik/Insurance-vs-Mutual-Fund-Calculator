function formatNumber(input) {
    input.classList.remove('error');
    let value = input.value.replace(/,/g, '');
    value = value.replace(/[^0-9.]/g, ''); 
    
    if (value.length > 3) {
        let parts = value.split('.');
        let integer = parts[0];
        let decimal = parts.length > 1 ? '.' + parts[1] : '';
        
        let lastThree = integer.slice(-3);
        let otherNumbers = integer.slice(0, -3);
        
        if (otherNumbers) {
            otherNumbers = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ",");
            integer = otherNumbers + "," + lastThree;
        }
        value = integer + decimal;
    }
    input.value = value;
}

// Attach formatting to all inputs
document.querySelectorAll('input').forEach(input => {
    input.addEventListener('input', function() { 
        formatNumber(this); 
    });
});

function calculateComparison() {
    const fields = ['policyTerm', 'premiumTerm', 'yearsPaid', 'monthlyPremium', 'surrenderValue', 'insuranceMaturity'];
    let isValid = true;

    // Red border validation logic
    fields.forEach(id => {
        const el = document.getElementById(id);
        if (el.value.trim() === "") {
            el.classList.add('error');
            isValid = false;
        } else {
            el.classList.remove('error');
        }
    });

    if (!isValid) return;

    const getVal = id => parseFloat(document.getElementById(id).value.replace(/,/g, '')) || 0;

    const pTerm = getVal('policyTerm');
    const payTerm = getVal('premiumTerm');
    const yPaid = getVal('yearsPaid');
    const monthlyPremium = getVal('monthlyPremium');
    const surrenderVal = getVal('surrenderValue');
    const insMaturityInput = getVal('insuranceMaturity');

    // Time Constants
    const totalRemainingYears = pTerm - yPaid;
    const remainingSIPYears = Math.max(0, payTerm - yPaid);
    const waitingYears = Math.max(0, totalRemainingYears - remainingSIPYears);

    const annualRate = 12; // 12% benchmark
    const r = (annualRate / 100) / 12; 
    const n_sip = remainingSIPYears * 12;

    // 1. Current Surrender Value Growth (Full Period)
    const lumpsumGrowth = surrenderVal * Math.pow(1 + (annualRate / 100), totalRemainingYears);

    // 2. SIP Growth Phase
    const sipMaturity = n_sip > 0 ? (monthlyPremium * ((Math.pow(1 + r, n_sip) - 1) / r)) : 0;

    // 3. Reinvestment Phase (SIP maturity becomes principal for lumpsum)
    const finalSIPValue = sipMaturity * Math.pow(1 + (annualRate / 100), waitingYears);

    const totalMFValue = lumpsumGrowth + finalSIPValue;

    // Lakh/Crore formatting logic
    const formatToWords = num => {
        if (num >= 10000000) {
            const val = Math.ceil((num / 10000000) * 100) / 100;
            return `₹${val.toFixed(2)} Crore`;
        } else if (num >= 100000) {
            const val = Math.ceil((num / 100000) * 100) / 100;
            return `₹${val.toFixed(2)} Lakh`;
        } else {
            return "₹" + Math.ceil(num).toLocaleString('en-IN');
        }
    };

    document.getElementById('mfValueText').innerText = formatToWords(totalMFValue);
    document.getElementById('insValueText').innerText = formatToWords(insMaturityInput);

    const verdictText = document.getElementById('verdictText');

    if (totalMFValue > insMaturityInput) {
        // Red arrow for surrendering
        verdictText.innerHTML = '<span style="color: #d9534f;">➤</span> You may consider surrendering the insurance policy and invest in mutual funds.';
    } else {
        // Green arrow for staying
        verdictText.innerHTML = '<span style="color: #28a745;">➤</span> You may continue the insurance policy.';
    }

    document.getElementById('results').style.display = 'block';
}