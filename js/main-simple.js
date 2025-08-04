// Test simple pour CEP
console.log("=== FAL Inpainting Plugin Loading ===");

// Attendre que la page soit chargée
document.addEventListener("DOMContentLoaded", function() {
    console.log("DOM loaded");
    initPlugin();
});

// Si DOMContentLoaded a déjà été déclenché
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initPlugin);
} else {
    initPlugin();
}

function initPlugin() {
    console.log("Initializing plugin...");
    
    // Vérifier si CSInterface est disponible
    if (typeof CSInterface === 'undefined') {
        console.error("CSInterface not available!");
        document.getElementById("status-text").textContent = "Status: CSInterface not loaded!";
        return;
    }
    
    console.log("CSInterface available");
    
    // Créer l'interface CEP
    var csInterface = new CSInterface();
    console.log("CSInterface created");
    
    // Tester la communication avec After Effects
    document.getElementById("status-text").textContent = "Status: Testing connection...";
    
    try {
        csInterface.evalScript("app.appName", function(result) {
            console.log("AE Response:", result);
            if (result) {
                document.getElementById("status-text").textContent = "Status: Connected to " + result;
                setupUI(csInterface);
            } else {
                document.getElementById("status-text").textContent = "Status: No response from After Effects";
            }
        });
    } catch (error) {
        console.error("Error testing connection:", error);
        document.getElementById("status-text").textContent = "Status: Connection error - " + error.message;
    }
}

function setupUI(csInterface) {
    console.log("Setting up UI...");
    
    var generateBtn = document.getElementById("generate-btn");
    if (!generateBtn) {
        console.error("Generate button not found!");
        return;
    }
    
    generateBtn.addEventListener("click", function() {
        console.log("Generate button clicked");
        document.getElementById("status-text").textContent = "Status: Button clicked - Testing AE communication...";
        
        // Test simple avec After Effects
        csInterface.evalScript("alert('Hello from CEP Plugin!'); app.appName;", function(result) {
            console.log("AE alert result:", result);
            document.getElementById("status-text").textContent = "Status: AE responded with " + result;
        });
    });
    
    document.getElementById("status-text").textContent = "Status: Ready! Click Generate to test.";
}

console.log("=== Plugin script loaded ===");