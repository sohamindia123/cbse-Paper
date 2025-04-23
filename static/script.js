document.getElementById('paperForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Show loading state
    const submitButton = e.target.querySelector('button[type="submit"]');
    const originalButtonText = submitButton.innerHTML;
    submitButton.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Generating...';
    submitButton.disabled = true;
    
    const formData = {
        subject: document.getElementById('subject').value,
        class: document.getElementById('class').value,
        mcq_count: document.getElementById('mcq_count').value,
        very_short_count: document.getElementById('very_short_count').value,
        short_count: document.getElementById('short_count').value,
        long_count: document.getElementById('long_count').value
    };

    try {
        const response = await fetch('/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        const data = await response.json();
        displayPaper(data);
        
        // Show action buttons
        document.getElementById('actionButtons').classList.remove('d-none');
        
        // Scroll to paper
        document.getElementById('paperOutput').scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred while generating the paper');
    } finally {
        // Reset button state
        submitButton.innerHTML = originalButtonText;
        submitButton.disabled = false;
    }
});

function displayPaper(data) {
    const output = document.getElementById('paperOutput');
    output.classList.remove('d-none');
    
    // Calculate question numbers for each section
    let questionNumber = 1;
    
    // Calculate time based on 2 minutes per mark
    const totalMinutes = data.total_marks * 2;
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    const timeString = hours > 0 
        ? (minutes > 0 ? `${hours} hour${hours > 1 ? 's' : ''} ${minutes} minute${minutes > 1 ? 's' : ''}` : `${hours} hour${hours > 1 ? 's' : ''}`)
        : `${minutes} minute${minutes > 1 ? 's' : ''}`;
    
    output.innerHTML = `
        <div class="text-center mb-4">
            <h2>CBSE Class ${data.class} ${data.subject} Question Paper</h2>
            <p class="text-muted">Total Marks: ${data.total_marks} | Time: ${timeString}</p>
            <p class="small text-muted">Based on CBSE Curriculum 2024-2025</p>
        </div>
        
        <div class="instructions mb-4">
            <h5><i class="bi bi-info-circle me-2"></i>General Instructions:</h5>
            <ol>
                <li>All questions are compulsory.</li>
                <li>The question paper has four sections: A, B, C and D.</li>
                <li>Internal choices are provided in some questions.</li>
                <li>Marks for each question are indicated against it.</li>
                <li>Time allocation is based on 2 minutes per mark.</li>
            </ol>
        </div>
    `;

    // Add sections
    if (data.content.A && data.content.A.length > 0) {
        output.innerHTML += `
            <div class="section-header">
                <i class="bi bi-check-circle me-2"></i>Section A: Multiple Choice Questions (1 mark each)
            </div>
            ${data.content.A.map((q, i) => `
                <div class="question">
                    <strong>${questionNumber++}.</strong> ${q.text} <span class="marks-indicator">1 Mark</span>
                    <div class="options">
                        ${q.options && Array.isArray(q.options) ? 
                            q.options.map((opt, j) => `
                                <div class="option">
                                    <strong>${['a', 'b', 'c', 'd'][j]})</strong> ${opt}
                                </div>
                            `).join('') : '<div class="error">Options not available</div>'}
                    </div>
                </div>
            `).join('')}
        `;
    }

    if (data.content.B && data.content.B.length > 0) {
        output.innerHTML += `
            <div class="section-header">
                <i class="bi bi-pencil me-2"></i>Section B: Very Short Answer Questions (2 marks each)
            </div>
            ${data.content.B.map((q) => `
                <div class="question">
                    <strong>${questionNumber++}.</strong> ${q.text} <span class="marks-indicator">2 Marks</span>
                </div>
            `).join('')}
        `;
    }

    if (data.content.C && data.content.C.length > 0) {
        output.innerHTML += `
            <div class="section-header">
                <i class="bi bi-pencil-square me-2"></i>Section C: Short Answer Questions (3 marks each)
            </div>
            ${data.content.C.map((q) => `
                <div class="question">
                    <strong>${questionNumber++}.</strong> ${q.text} <span class="marks-indicator">3 Marks</span>
                </div>
            `).join('')}
        `;
    }

    if (data.content.D && data.content.D.length > 0) {
        output.innerHTML += `
            <div class="section-header">
                <i class="bi bi-file-text me-2"></i>Section D: Long Answer Questions (5 marks each)
            </div>
            ${data.content.D.map((q) => `
                <div class="question">
                    <strong>${questionNumber++}.</strong> ${q.text} <span class="marks-indicator">5 Marks</span>
                </div>
            `).join('')}
        `;
    }
    
    // Add horizontal rule at the end
    output.innerHTML += `
        <hr class="mt-5" style="border-top: 2px solid var(--dark-red);">
        <div class="mb-5"></div>
    `;
}

// Print functionality
document.getElementById('printButton')?.addEventListener('click', function() {
    // Create watermark elements on all pages before printing
    const paperOutput = document.getElementById('paperOutput');
    const watermarkDiv = document.createElement('div');
    watermarkDiv.style.position = 'fixed';
    watermarkDiv.style.bottom = '20px';
    watermarkDiv.style.right = '30px';
    watermarkDiv.style.fontSize = '16px'; // Smaller font
    watermarkDiv.style.fontWeight = 'bold';
    watermarkDiv.style.color = '#92140C';
    watermarkDiv.style.opacity = '0.3'; // Reduced opacity for fainter watermark
    watermarkDiv.style.transform = 'rotate(-5deg)';
    watermarkDiv.style.zIndex = '9999';
    watermarkDiv.style.pointerEvents = 'none';
    watermarkDiv.innerHTML = 'Made By Soham Wagh ❤️';
    document.body.appendChild(watermarkDiv);
    
    // Print the document
    window.print();
    
    // Remove the watermark after printing
    setTimeout(() => {
        document.body.removeChild(watermarkDiv);
    }, 1000);
});

// Dark mode toggle functionality
document.addEventListener('DOMContentLoaded', function() {
    const darkModeToggle = document.getElementById('darkModeToggle');
    const icon = darkModeToggle.querySelector('i');
    
    // Check for saved theme preference or use preferred color scheme
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    // Set initial theme
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
        document.documentElement.setAttribute('data-theme', 'dark');
        icon.classList.remove('bi-moon-fill');
        icon.classList.add('bi-sun-fill');
    }
    
    // Toggle theme on button click
    darkModeToggle.addEventListener('click', function() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        let newTheme = 'light';
        
        if (currentTheme !== 'dark') {
            newTheme = 'dark';
            icon.classList.remove('bi-moon-fill');
            icon.classList.add('bi-sun-fill');
        } else {
            icon.classList.remove('bi-sun-fill');
            icon.classList.add('bi-moon-fill');
        }
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
    });
}); 