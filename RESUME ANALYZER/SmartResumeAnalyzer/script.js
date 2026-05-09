document.addEventListener('DOMContentLoaded', () => {
    const analyzeBtn = document.getElementById('analyze-btn');
    const resumeTextarea = document.getElementById('resume-text');
    const resultsPanel = document.getElementById('results-panel');
    const scoreProgress = document.getElementById('score-progress');
    const scoreValue = document.getElementById('score-value');
    const detectedSkillsContainer = document.getElementById('detected-skills');
    const missingSkillsContainer = document.getElementById('missing-skills');
    const suggestionsList = document.getElementById('suggestions-list');
    const authenticityBadge = document.getElementById('authenticity-badge');

    // Predefined lists for analysis
    const CORE_SKILLS = [
        'javascript', 'python', 'java', 'c++', 'c#', 'ruby', 'php', 'typescript', 'swift', 'go',
        'html', 'css', 'react', 'angular', 'vue', 'node.js', 'express', 'django', 'flask', 'spring',
        'sql', 'mysql', 'postgresql', 'mongodb', 'redis', 'firebase', 'aws', 'azure', 'gcp',
        'docker', 'kubernetes', 'git', 'github', 'jenkins', 'linux', 'machine learning', 'data analysis',
        'power bi', 'tableau', 'excel'
    ];

    const BUZZWORDS = [
        'synergy', 'ninja', 'rockstar', 'go-getter', 'thought leader', 'disruptor', 'game changer',
        'guru', 'wizard', 'outside the box'
    ];

    analyzeBtn.addEventListener('click', () => {
        const text = resumeTextarea.value.trim();
        if (!text) {
            alert('Please paste your resume text first.');
            return;
        }

        // Show results panel
        resultsPanel.classList.remove('hidden');
        
        // Reset old data
        detectedSkillsContainer.innerHTML = '';
        missingSkillsContainer.innerHTML = '';
        suggestionsList.innerHTML = '';
        authenticityBadge.className = 'badge';
        authenticityBadge.innerHTML = '';

        // Perform analysis
        const analysis = analyzeResume(text);
        
        // Render UI
        renderResults(analysis);
    });

    function analyzeResume(text) {
        const lowerText = text.toLowerCase();
        
        // 1. Extract Skills & Keyword Stuffing Check
        const detectedSkills = [];
        const missingSkills = [];
        let maxRepetitions = 0;
        let mostRepeatedSkill = '';

        CORE_SKILLS.forEach(skill => {
            // Regex to find whole words/phrases matching the skill
            const regex = new RegExp(`\\b${skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
            const matches = text.match(regex);
            
            if (matches && matches.length > 0) {
                detectedSkills.push(skill);
                if (matches.length > maxRepetitions) {
                    maxRepetitions = matches.length;
                    mostRepeatedSkill = skill;
                }
            } else {
                missingSkills.push(skill);
            }
        });

        // Pick top 10 missing skills to show
        const displayMissingSkills = missingSkills.slice(0, 8);

        // 2. Authenticity Checks
        const hasEmail = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(text);
        const hasPhone = /(\+\d{1,2}\s?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/.test(text);
        
        let buzzwordCount = 0;
        BUZZWORDS.forEach(word => {
            if (lowerText.includes(word)) buzzwordCount++;
        });

        // Determine if Fake or Original
        let isAuthentic = true;
        const fakeReasons = [];

        if (!hasEmail && !hasPhone) {
            isAuthentic = false;
            fakeReasons.push("Missing basic contact information (Email/Phone).");
        }
        
        if (maxRepetitions > 7) {
            isAuthentic = false;
            fakeReasons.push(`Keyword stuffing detected: "${mostRepeatedSkill}" appears ${maxRepetitions} times.`);
        }

        if (buzzwordCount > 3) {
            isAuthentic = false;
            fakeReasons.push("Excessive use of empty corporate buzzwords (e.g., 'ninja', 'synergy').");
        }

        if (detectedSkills.length > 25) {
            isAuthentic = false;
            fakeReasons.push("Implausible number of core skills claimed. ('Too Perfect' flag)");
        }

        // 3. Score Calculation
        let baseScore = 40; // Base score just for having text
        if (hasEmail) baseScore += 10;
        if (hasPhone) baseScore += 10;
        
        // Add points for skills (up to 40 pts)
        const skillScore = Math.min(detectedSkills.length * 3, 40);
        
        let finalScore = baseScore + skillScore;

        // Penalize for fake markers
        if (!isAuthentic) {
            finalScore -= 30;
        }

        // Bound score between 0 and 100
        finalScore = Math.max(0, Math.min(100, finalScore));

        // 4. Generate Suggestions
        const suggestions = [];
        if (!hasEmail || !hasPhone) {
            suggestions.push("Add a professional email address and phone number at the top of your resume.");
        }
        if (detectedSkills.length < 5) {
            suggestions.push("Your resume lacks technical keywords. Ensure you explicitly list tools and languages you know.");
        }
        if (maxRepetitions > 7) {
            suggestions.push("Avoid keyword stuffing. Repeating the same skill too many times can trigger ATS spam filters.");
        }
        if (buzzwordCount > 0) {
            suggestions.push("Replace empty buzzwords with actual metrics and achievements (e.g., increased sales by 20% instead of 'results-driven ninja').");
        }
        if (displayMissingSkills.length > 0 && isAuthentic) {
            suggestions.push(`Consider learning or adding high-demand skills like: ${displayMissingSkills.slice(0,3).join(', ')}.`);
        }

        if (suggestions.length === 0) {
            suggestions.push("Great job! Your resume looks solid. Keep it updated with your latest achievements.");
        }

        return {
            score: finalScore,
            detectedSkills,
            missingSkills: displayMissingSkills,
            isAuthentic,
            fakeReasons,
            suggestions
        };
    }

    function renderResults(analysis) {
        // Render Badge
        if (analysis.isAuthentic) {
            authenticityBadge.textContent = 'Original / Authentic';
            authenticityBadge.classList.add('original');
        } else {
            authenticityBadge.textContent = 'Potentially Fake / Stuffed';
            authenticityBadge.classList.add('fake');
        }

        // Render Score Animation
        let currentScore = 0;
        const targetScore = analysis.score;
        const duration = 1500; // ms
        const intervalTime = 20;
        const steps = duration / intervalTime;
        const increment = targetScore / steps;

        const scoreInterval = setInterval(() => {
            currentScore += increment;
            if (currentScore >= targetScore) {
                currentScore = targetScore;
                clearInterval(scoreInterval);
            }
            
            scoreValue.textContent = Math.round(currentScore) + '%';
            // Update conic gradient
            const degrees = (currentScore / 100) * 360;
            scoreProgress.style.background = `conic-gradient(var(--accent-primary) ${degrees}deg, rgba(255, 255, 255, 0.1) ${degrees}deg)`;
        }, intervalTime);

        // Render Tags
        analysis.detectedSkills.forEach((skill, index) => {
            const span = document.createElement('span');
            span.className = 'tag';
            span.textContent = skill;
            span.style.animationDelay = `${index * 0.05}s`;
            detectedSkillsContainer.appendChild(span);
        });

        if (analysis.detectedSkills.length === 0) {
            detectedSkillsContainer.innerHTML = '<span style="color:var(--text-muted); font-size:0.9rem;">No core skills detected.</span>';
        }

        analysis.missingSkills.forEach((skill, index) => {
            const span = document.createElement('span');
            span.className = 'tag';
            span.textContent = skill;
            span.style.animationDelay = `${index * 0.05}s`;
            missingSkillsContainer.appendChild(span);
        });

        // Render Suggestions & Fake Reasons
        const allNotes = [...(analysis.isAuthentic ? [] : analysis.fakeReasons), ...analysis.suggestions];
        
        allNotes.forEach((note, index) => {
            const li = document.createElement('li');
            li.textContent = note;
            if (!analysis.isAuthentic && index < analysis.fakeReasons.length) {
                li.style.borderLeftColor = 'var(--danger)';
                li.style.color = '#fca5a5'; // lighter red
            }
            li.style.animationDelay = `${index * 0.1}s`;
            suggestionsList.appendChild(li);
        });
    }
});
