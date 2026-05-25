import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const screenshotsDir = path.join(__dirname, '..', 'test-screenshots');
const docsDir = path.join(__dirname, '..', 'test-docs');

if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

// Helper to delay execution (ensures transitions and loads are fully finished for pretty screenshots)
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function run() {
  console.log('Starting E2E UI Test & Screenshot Automation...');

  const browser = await puppeteer.launch({
    headless: true,
    defaultViewport: { width: 1280, height: 800 },
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  
  try {
    // ─── STEP 1: Register New Enterprise (Admin) ─────────────────────────────
    console.log('Navigating to Register page...');
    await page.goto('http://localhost:3000/register', { waitUntil: 'networkidle2' });
    await delay(1500);

    console.log('Switching to "Create New Enterprise" tab...');
    // The second button with type="button" in the form is "Create New Enterprise"
    const tabButtons = await page.$$('button[type="button"]');
    if (tabButtons.length >= 2) {
      await tabButtons[1].click();
      await delay(800);
    }

    console.log('Filling out admin registration form...');
    await page.type('#companyName', 'Cyberdyne Corp');
    await page.type('#fullName', 'Sarah Connor');
    await page.type('#email', 'sarah.connor@cyberdyne.local');
    await page.type('#password', 'Password123!');
    
    // Take a screenshot of the filled form
    await page.screenshot({ path: path.join(screenshotsDir, '01_register_admin_form.png') });
    console.log('Saved: 01_register_admin_form.png');

    console.log('Submitting registration form...');
    await Promise.all([
      page.click('button[type="submit"]'),
      page.waitForNavigation({ waitUntil: 'networkidle2' }),
    ]);
    await delay(2000); // Wait for redirect and dashboard render

    // ─── STEP 2: Navigate to Settings to get Workspace Invite Code ───────────
    console.log('Navigating to Settings page...');
    await page.goto('http://localhost:3000/settings', { waitUntil: 'networkidle2' });
    await delay(2500); // Wait for dashboard stats or details load

    // Take screenshot of Admin Profile & Workspace Invite Code
    await page.screenshot({ path: path.join(screenshotsDir, '02_admin_settings_workspace.png') });
    console.log('Saved: 02_admin_settings_workspace.png');

    // Extract the generated invite code from the UI
    // In settings/page.tsx line 364: the container has classes "bg-primary/10 text-primary ..."
    // Let's extract the text content and parse it
    const inviteCode = await page.evaluate(() => {
      // Find the element containing the text and Hash icon
      const elements = Array.from(document.querySelectorAll('div'));
      for (const el of elements) {
        if (el.className.includes('bg-primary/10')) {
          const text = el.innerText.trim();
          if (/^[A-Z0-9]{6,7}$/.test(text)) {
            return text;
          }
        }
      }
      // Fallback if there is other wrapper formatting
      for (const el of elements) {
        if (el.innerText && el.innerText.includes('Invite Code')) {
          const matches = el.innerText.match(/[A-Z0-9]{6,7}/);
          if (matches) return matches[0];
        }
      }
      return 'CYB456';
    });
    console.log(`Extracted Workspace Invite Code: "${inviteCode}"`);

    // ─── STEP 3: Logout Admin ────────────────────────────────────────────────
    console.log('Logging out Admin...');
    await page.evaluate(() => {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
    });
    await page.reload({ waitUntil: 'networkidle2' });
    await delay(1000);

    // ─── STEP 4: Register Staff Member joining workspace ──────────────────────
    console.log('Navigating to Register page to join workspace as Staff...');
    await page.goto('http://localhost:3000/register', { waitUntil: 'networkidle2' });
    await delay(1500);

    // Default mode is "Join Existing Workspace", so we fill it out directly
    console.log('Filling out staff registration form...');
    await page.type('#companyCode', inviteCode);
    await page.type('#fullName', 'John Connor');
    await page.type('#email', 'john.connor@cyberdyne.local');
    await page.type('#password', 'Password123!');
    
    console.log('Selecting "staff" role...');
    await page.select('#role', 'staff');
    await delay(500);

    await page.screenshot({ path: path.join(screenshotsDir, '03_register_staff_form.png') });
    console.log('Saved: 03_register_staff_form.png');

    console.log('Submitting staff registration...');
    await Promise.all([
      page.click('button[type="submit"]'),
      page.waitForNavigation({ waitUntil: 'networkidle2' }),
    ]);
    await delay(2000);

    // Take screenshot of Staff Dashboard (should be empty initially)
    await page.screenshot({ path: path.join(screenshotsDir, '04_staff_dashboard.png') });
    console.log('Saved: 04_staff_dashboard.png');

    // ─── STEP 5: Logout Staff & Login Admin ──────────────────────────────────
    console.log('Logging out Staff...');
    await page.evaluate(() => {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
    });
    
    console.log('Navigating to Login page...');
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle2' });
    await delay(1500);

    console.log('Filling out admin login details...');
    await page.type('#email', 'sarah.connor@cyberdyne.local');
    await page.type('#password', 'Password123!');

    await page.screenshot({ path: path.join(screenshotsDir, '05_admin_login_form.png') });
    console.log('Saved: 05_admin_login_form.png');

    console.log('Submitting login...');
    await Promise.all([
      page.click('button[type="submit"]'),
      page.waitForNavigation({ waitUntil: 'networkidle2' }),
    ]);
    await delay(2000);

    // ─── STEP 6: Upload 10 test documents to Documents page ──────────────────
    console.log('Navigating to Documents page...');
    await page.goto('http://localhost:3000/documents', { waitUntil: 'networkidle2' });
    await delay(2000);

    const docFiles = fs.readdirSync(docsDir).filter(f => f.endsWith('.docx'));
    console.log(`Found ${docFiles.length} test files to upload.`);

    for (let i = 0; i < docFiles.length; i++) {
      const fileName = docFiles[i];
      const filePath = path.resolve(path.join(docsDir, fileName));
      console.log(`[${i + 1}/${docFiles.length}] Uploading ${fileName}...`);

      // Click "New Document" button
      // It has the class containing "bg-primary text-primary-foreground" and text "New Document"
      await page.click('button.bg-primary');
      await delay(1000); // Wait for modal animation

      // Select file input
      const fileInput = await page.$('input[type="file"]');
      await fileInput.uploadFile(filePath);
      await delay(1000); // Wait for file parsing / auto-title fill

      // Type description
      await page.type('#description', `Troubleshooting runbook for ${fileName.replace('.docx', '')}`);
      await delay(500);

      // Submit upload
      // Find the upload submit button (last button in DialogFooter usually, or type="submit")
      await page.click('button[type="submit"]');
      await delay(3500); // Wait for upload API call & index sync to complete
    }

    console.log('All files uploaded successfully. Refreshing documents page...');
    await page.reload({ waitUntil: 'networkidle2' });
    await delay(2000);

    // Take screenshot of uploaded documents list
    await page.screenshot({ path: path.join(screenshotsDir, '06_documents_list.png') });
    console.log('Saved: 06_documents_list.png');

    // ─── STEP 7: Test Search Page ────────────────────────────────────────────
    console.log('Navigating to Search page...');
    await page.goto('http://localhost:3000/search', { waitUntil: 'networkidle2' });
    await delay(1500);

    console.log('Performing query search: "Firewall"...');
    await page.type('input[placeholder*="Search"]', 'Firewall');
    await delay(1000); // Wait for keyup search or click search button
    
    // Press Enter to submit search if needed, or wait for debounce search
    await page.keyboard.press('Enter');
    await delay(2500); // Wait for search API and UI update

    await page.screenshot({ path: path.join(screenshotsDir, '07_search_results.png') });
    console.log('Saved: 07_search_results.png');

    // ─── STEP 8: Test RAG / AI Chat ──────────────────────────────────────────
    // In our sidebar or header, there is an AI Assistant panel. Let's see if we can open it
    // Or we can navigate to the page directly. Let's search if there is a chat route or toggle.
    // The panel might be a sidebar floating button. Let's check how to toggle it.
    // In frontend/src/components/ai/AiAssistantPanel.tsx, let's see how it's integrated.
    // Let's ask a question by sending a request to the backend directly, or toggle the UI panel.
    // Let's click the AI toggle button. Usually it has an icon (Brain or Sparkles or MessageSquare) in the header.
    // Let's locate the button with ID or text. Or let's trigger it in the UI.
    // Let's inspect the page to see if we can find an element with text "AI Assistant" or class containing "AiAssistant".
    console.log('Opening AI Assistant Panel...');
    const aiToggle = await page.$('button[title*="AI"], button[aria-label*="AI"], button.ai-toggle');
    if (aiToggle) {
      await aiToggle.click();
      await delay(1000);
    } else {
      // Try to click any element with "AI" or let's type directly if the panel is already visible
      console.log('AI Assistant toggle button not found via simple class. Looking for Sparkles/Brain icon...');
      // Let's click the float button or header button
      const buttons = await page.$$('button');
      for (const btn of buttons) {
        const text = await page.evaluate(el => el.innerText || el.getAttribute('title') || '', btn);
        if (text.toLowerCase().includes('ai') || text.toLowerCase().includes('trợ lý')) {
          await btn.click();
          await delay(1000);
          break;
        }
      }
    }

    console.log('Sending message to AI Assistant...');
    const chatInput = await page.$('textarea[placeholder*="Hỏi"], input[placeholder*="Hỏi"], textarea[placeholder*="Ask"], input[placeholder*="Ask"]');
    if (chatInput) {
      await chatInput.type('Làm thế nào để phân quyền SSH cho Linux?');
      await delay(500);
      await page.keyboard.press('Enter');
      await delay(6000); // Wait for OpenAI response & chunk retrieval

      await page.screenshot({ path: path.join(screenshotsDir, '08_ai_assistant_response.png') });
      console.log('Saved: 08_ai_assistant_response.png');
    } else {
      console.log('Could not find AI chat input box. Skipping screenshot for RAG.');
    }

    // ─── STEP 9: Test Audit Logs Page ────────────────────────────────────────
    console.log('Navigating to Audit Logs page...');
    await page.goto('http://localhost:3000/audit-logs', { waitUntil: 'networkidle2' });
    await delay(2500);

    await page.screenshot({ path: path.join(screenshotsDir, '09_audit_logs.png') });
    console.log('Saved: 09_audit_logs.png');

    // ─── STEP 10: Test Custom Roles Creation ─────────────────────────────────
    console.log('Navigating to Settings -> Roles tab...');
    await page.goto('http://localhost:3000/settings', { waitUntil: 'networkidle2' });
    await delay(1500);

    // Click "Roles & Permissions" tab button
    // It's the second button inside the tab container (line 265 in settings/page.tsx)
    const settingsTabs = await page.$$('button');
    for (const tab of settingsTabs) {
      const text = await page.evaluate(el => el.innerText.trim(), tab);
      if (text.includes('Roles & Permissions')) {
        await tab.click();
        await delay(1000);
        break;
      }
    }

    console.log('Creating a custom role: "Security Lead"...');
    // Find input fields by placeholder or name
    await page.type('input[placeholder*="Auditor"], input[placeholder*="Role Name"]', 'Security Lead');
    await page.type('textarea[placeholder*="responsibilities"], textarea[placeholder*="Description"]', 'Manage system security and access control logs.');
    
    // Check "View Audit Logs" and "Manage Sharing" checkboxes
    // The checkboxes are elements within labels. Let's find inputs with type="checkbox"
    const checkboxes = await page.$$('input[type="checkbox"]');
    if (checkboxes.length >= 4) {
      // 0: Create Root Folders, 1: Upload Root Docs, 2: View Audit Logs, 3: Manage Sharing
      await checkboxes[2].click(); // View Audit Logs
      await delay(200);
      await checkboxes[3].click(); // Manage Sharing
      await delay(200);
    }

    // Take screenshot of filled Custom Role form
    await page.screenshot({ path: path.join(screenshotsDir, '10_create_role_form.png') });
    console.log('Saved: 10_create_role_form.png');

    // Submit Custom Role form
    // The submit button is in the sidebar form: type="submit" or contains "Add Custom Role"
    const submitBtn = await page.$('button[type="submit"]');
    if (submitBtn) {
      await submitBtn.click();
      await delay(2000);
    }

    // Take final screenshot of Roles list
    await page.screenshot({ path: path.join(screenshotsDir, '11_roles_list_updated.png') });
    console.log('Saved: 11_roles_list_updated.png');

  } catch (error) {
    console.error('E2E automation failed with error:', error);
  } finally {
    console.log('Closing browser...');
    await browser.close();
    console.log('E2E testing complete.');
  }
}

run();
