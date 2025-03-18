document.addEventListener('DOMContentLoaded', function() {
    // DOM elements
    const primeNumberElement = document.getElementById('prime-number');
    const generateButton = document.getElementById('generate-btn');
    const minRangeInput = document.getElementById('min-range');
    const maxRangeInput = document.getElementById('max-range');
    const minValueDisplay = document.getElementById('min-value');
    const maxValueDisplay = document.getElementById('max-value');
    const chartCanvas = document.getElementById('primeChart');

    // Cache for prime numbers
    let primeCache = {};

    // Chart instance
    let primeChart = null;

    // Function to check if a number is prime
    function isPrime(num) {
        if (num <= 1) return false;
        if (num <= 3) return true;
        if (num % 2 === 0 || num % 3 === 0) return false;

        let i = 5;
        while (i * i <= num) {
            if (num % i === 0 || num % (i + 2) === 0) return false;
            i += 6;
        }
        return true;
    }

    // Function to generate all primes in a range
    function generatePrimes(min, max) {
        const cacheKey = `${min}-${max}`;

        // Return from cache if available
        if (primeCache[cacheKey]) {
            return primeCache[cacheKey];
        }

        const primes = [];
        for (let i = min; i <= max; i++) {
            if (isPrime(i)) {
                primes.push(i);
            }
        }

        // Store in cache
        primeCache[cacheKey] = primes;
        return primes;
    }

    // Function to get a random prime number
    function getRandomPrime(min, max) {
        const primes = generatePrimes(min, max);

        if (primes.length === 0) {
            return "No primes in range";
        }

        const randomIndex = Math.floor(Math.random() * primes.length);
        return primes[randomIndex];
    }

    // Function to prepare data for the polar chart
    function prepareChartData(primes) {
        // For polar chart, we need labels and values
        const labels = primes.map((_, index) => `${index + 1}`);
        const values = primes;

        return {
            labels: labels,
            values: values
        };
    }

    // Function to create or update the chart
    function updateChart(min, max) {
        const primes = generatePrimes(min, max);
        const chartData = prepareChartData(primes);

        // Limit the number of primes to display for better readability
        const maxPrimesToShow = 50;
        let displayPrimes = primes;
        let displayLabels = chartData.labels;

        if (primes.length > maxPrimesToShow) {
            // Sample primes evenly across the range
            const step = Math.floor(primes.length / maxPrimesToShow);
            displayPrimes = [];
            displayLabels = [];

            for (let i = 0; i < primes.length; i += step) {
                displayPrimes.push(primes[i]);
                displayLabels.push(chartData.labels[i]);
            }
        }

        // Calculate the maximum value for scaling
        const maxValue = Math.max(...displayPrimes);

        if (primeChart) {
            // Update existing chart
            primeChart.data.labels = displayLabels;
            primeChart.data.datasets[0].data = displayPrimes;
            primeChart.options.scales.r.max = maxValue * 1.1; // Add 10% padding
            primeChart.update();
        } else {
            // Create new polar chart
            primeChart = new Chart(chartCanvas, {
                type: 'polarArea',
                data: {
                    labels: displayLabels,
                    datasets: [{
                        label: 'Prime Numbers',
                        data: displayPrimes,
                        backgroundColor: displayPrimes.map((_, i) => {
                            // Create a gradient of colors
                            const hue = (i * 360 / displayPrimes.length) % 360;
                            return `hsla(${hue}, 70%, 60%, 0.7)`;
                        }),
                        borderColor: 'rgba(255, 255, 255, 0.5)',
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        title: {
                            display: true,
                            text: 'Prime Number Distribution (Dial)',
                            font: {
                                size: 16
                            }
                        },
                        tooltip: {
                            callbacks: {
                                title: function(context) {
                                    return `Position: ${context[0].label}`;
                                },
                                label: function(context) {
                                    return `Prime: ${context.raw}`;
                                }
                            }
                        },
                        legend: {
                            display: false
                        }
                    },
                    scales: {
                        r: {
                            min: 0,
                            max: maxValue * 1.1, // Add 10% padding
                            ticks: {
                                stepSize: Math.ceil(maxValue / 5),
                                backdropColor: 'rgba(255, 255, 255, 0.75)'
                            },
                            grid: {
                                color: 'rgba(0, 0, 0, 0.1)'
                            },
                            angleLines: {
                                color: 'rgba(0, 0, 0, 0.1)'
                            }
                        }
                    }
                }
            });
        }
    }

    // Update min/max displays and chart when sliders change
    minRangeInput.addEventListener('input', function() {
        const minValue = parseInt(this.value);
        minValueDisplay.textContent = minValue;

        // Ensure max is always >= min
        if (minValue >= maxRangeInput.value) {
            maxRangeInput.value = minValue + 1;
            maxValueDisplay.textContent = minValue + 1;
        }

        // Update chart with debounce to prevent excessive updates
        clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(() => {
            updateChart(minValue, parseInt(maxRangeInput.value));
        }, 300);
    });

    maxRangeInput.addEventListener('input', function() {
        const maxValue = parseInt(this.value);
        maxValueDisplay.textContent = maxValue;

        // Ensure min is always <= max
        if (maxValue <= minRangeInput.value) {
            minRangeInput.value = maxValue - 1;
            minValueDisplay.textContent = maxValue - 1;
        }

        // Update chart with debounce to prevent excessive updates
        clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(() => {
            updateChart(parseInt(minRangeInput.value), maxValue);
        }, 300);
    });

    // Generate a random prime when button is clicked
    generateButton.addEventListener('click', function() {
        const min = parseInt(minRangeInput.value);
        const max = parseInt(maxRangeInput.value);

        // Show loading state
        primeNumberElement.textContent = "...";

        // Use setTimeout to allow the UI to update before the calculation
        setTimeout(() => {
            const randomPrime = getRandomPrime(min, max);
            primeNumberElement.textContent = randomPrime;

            // Highlight the selected prime in the chart
            if (primeChart && typeof randomPrime === 'number') {
                const primes = generatePrimes(min, max);
                const primeIndex = primes.indexOf(randomPrime);

                if (primeIndex !== -1) {
                    // For polar chart, we need to highlight the specific segment
                    // First, reset all backgrounds to their default
                    const maxPrimesToShow = 50;
                    let step = 1;

                    if (primes.length > maxPrimesToShow) {
                        step = Math.floor(primes.length / maxPrimesToShow);
                    }

                    // Reset all colors
                    primeChart.data.datasets[0].backgroundColor = primeChart.data.datasets[0].data.map((_, i) => {
                        const hue = (i * 360 / primeChart.data.datasets[0].data.length) % 360;
                        return `hsla(${hue}, 70%, 60%, 0.7)`;
                    });

                    // Find the index in the displayed data
                    const displayedIndex = Math.floor(primeIndex / step);
                    if (displayedIndex < primeChart.data.datasets[0].data.length) {
                        // Highlight the selected prime
                        primeChart.data.datasets[0].backgroundColor[displayedIndex] = 'rgba(255, 0, 0, 0.8)';
                    }

                    primeChart.update();
                }
            }
        }, 10);
    });

    // Initialize chart on page load
    updateChart(parseInt(minRangeInput.value), parseInt(maxRangeInput.value));

    // Handle window resize to ensure chart responsiveness
    let resizeTimeout;
    window.addEventListener('resize', function() {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(function() {
            if (primeChart) {
                primeChart.resize();
                primeChart.update();
            }
        }, 250);
    });
});