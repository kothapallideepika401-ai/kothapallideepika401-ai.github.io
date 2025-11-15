const topics = {
    pointers: {
        title: "Pointers & Memory",
        description: "Understand memory addresses and how pointers reference data",
        code: `#include <stdio.h>

int main() {
    int x = 25;
    int *ptr = &x;
    
    printf("Value of x: %d\\n", x);
    printf("Address of x: %p\\n", &x);
    printf("Pointer ptr: %p\\n", ptr);
    printf("Dereferenced ptr: %d\\n", *ptr);
    
    return 0;
}`
    },
    recursion: {
        title: "Recursion",
        description: "Master recursive functions and understand the call stack",
        code: `#include <stdio.h>

int factorial(int n) {
    if (n <= 1) return 1;
    return n * factorial(n - 1);
}

int main() {
    int result = factorial(5);
    printf("Factorial of 5: %d\\n", result);
    return 0;
}`
    }
};

let currentTopic = "pointers";

document.addEventListener("DOMContentLoaded", () => {
    loadTopic("pointers");
    setupEventListeners();
});

function setupEventListeners() {
    document.querySelectorAll(".nav-item").forEach(btn => {
        btn.addEventListener("click", () => {
            const topic = btn.dataset.topic;
            loadTopic(topic);
        });
    });

    document.getElementById("visualizeBtn").addEventListener("click", visualizeMemory);
    document.getElementById("resetBtn").addEventListener("click", resetCode);
    document.getElementById("explainBtn").addEventListener("click", explainWithAI);
}

function loadTopic(topicKey) {
    currentTopic = topicKey;
    const topic = topics[topicKey];

    document.querySelectorAll(".nav-item").forEach(btn => {
        btn.classList.remove("active");
        if (btn.dataset.topic === topicKey) btn.classList.add("active");
    });

    document.getElementById("topicTitle").textContent = topic.title;
    document.getElementById("topicDescription").textContent = topic.description;
    document.getElementById("codeEditor").value = topic.code;
    document.getElementById("output").innerHTML = '<p class="output-placeholder">Click "Visualize Memory" to see output...</p>';
    document.getElementById("memoryVisualizer").innerHTML = '';
    document.getElementById("explanationBox").classList.add("hidden");

    document.querySelector(".content").scrollTop = 0;
}

function visualizeMemory() {
    const code = document.getElementById("codeEditor").value;
    const output = document.getElementById("output");
    const visualizer = document.getElementById("memoryVisualizer");

    if (currentTopic === "pointers") {
        visualizePointerMemory(code, visualizer, output);
    } else if (currentTopic === "recursion") {
        visualizeRecursionStack(code, visualizer, output);
    }
}

function visualizePointerMemory(code, visualizer, output) {
    const varRegex = /(\w+)\s+(\*?)(\w+)\s*=\s*([^;]+);/g;
    const variables = [];
    let match;

    while ((match = varRegex.exec(code)) !== null) {
        variables.push({
            type: match[1],
            isPointer: match[2] === "*",
            name: match[3],
            value: match[4].trim()
        });
    }

    let baseAddr = 0x7fff5fbff8c0;
    let stackHTML = `<div class="stack-diagram">`;
    
    // Top of stack
    stackHTML += `<div class="stack-label">Higher Memory ↑</div>`;
    
    variables.forEach((variable, index) => {
        const addr = baseAddr + index * 8;
        const addrHex = "0x" + addr.toString(16);
        
        if (variable.isPointer) {
            const pointsToAddr = baseAddr + (index - 1) * 8;
            const pointsToHex = "0x" + pointsToAddr.toString(16);
            
            stackHTML += `
                <div class="stack-cell pointer-cell">
                    <div class="stack-addr">${addrHex}</div>
                    <div class="stack-var-name">${variable.name}</div>
                    <div class="stack-value pointer-value">→ ${pointsToHex}</div>
                </div>
            `;
        } else {
            stackHTML += `
                <div class="stack-cell value-cell">
                    <div class="stack-addr">${addrHex}</div>
                    <div class="stack-var-name">${variable.name}</div>
                    <div class="stack-value">${variable.value}</div>
                </div>
            `;
        }
    });
    
    // Bottom of stack
    stackHTML += `<div class="stack-label">Lower Memory ↓</div></div>`;

    // Details panel
    let detailsHTML = `<div class="memory-details">`;
    detailsHTML += `<div class="details-title">Variable Analysis</div>`;
    
    variables.forEach((variable) => {
        detailsHTML += `
            <div class="detail-item">
                <div class="detail-name">${variable.name}</div>
                <div class="detail-info">
                    <span>Type: <code>${variable.type}${variable.isPointer ? "*" : ""}</code></span><br>
                    <span>Value: <code>${variable.value}</code></span><br>
                    <span class="detail-size">${variable.type === "int" ? "4 bytes" : "8 bytes"}</span>
                </div>
            </div>
        `;
    });
    
    detailsHTML += `</div>`;

    visualizer.innerHTML = stackHTML + detailsHTML;

    // Display output
    const printfRegex = /printf\s*$$\s*"([^"]+)"\s*(?:,\s*(.+?))?\s*$$/g;
    let printfMatch;
    let outputText = "";

    while ((printfMatch = printfRegex.exec(code)) !== null) {
        let text = printfMatch[1].replace(/\\n/g, "\n").replace(/\\t/g, "\t");
        
        variables.forEach(variable => {
            text = text.replace(new RegExp(variable.name, "g"), variable.value);
        });
        
        outputText += text + "\n";
    }

    if (outputText) {
        output.innerHTML = `<pre>${outputText}</pre>`;
    } else {
        output.innerHTML = '<p style="color: #ff6b6b;">No printf output detected. Add printf statements to see execution output.</p>';
    }
}

function visualizeRecursionStack(code, visualizer, output) {
    let stackHTML = `<div class="call-stack-container">`;
    stackHTML += `<div class="call-stack-title">Recursion Tree & Call Stack</div>`;
    
    const callFrames = generateCallFrames(code);
    const treeHTML = generateRecursionTree(code);
    
    // Display tree visualization
    stackHTML += `<div class="tree-visualization">${treeHTML}</div>`;
    
    // Display call stack with return values
    stackHTML += `<div class="call-stack-frames">`;
    stackHTML += `<div class="stack-phase-title">Call Stack (Down) & Return (Up)</div>`;
    
    callFrames.forEach((frame, index) => {
        const isBase = frame.isBase;
        stackHTML += `
            <div class="call-frame ${isBase ? "base-case" : "recursive"}">
                <div class="frame-call">${frame.call}</div>
                <div class="frame-state">
                    <span class="param">n = ${frame.n}</span>
                    ${frame.isBase ? '<span class="base-indicator">BASE CASE</span>' : ''}
                </div>
                <div class="frame-return">
                    <span class="return-label">Returns:</span>
                    <span class="return-value">${frame.returnValue}</span>
                </div>
                ${index < callFrames.length - 1 ? '<div class="frame-arrow">↓</div>' : ''}
            </div>
        `;
    });
    
    stackHTML += `</div></div>`;
    
    visualizer.innerHTML = stackHTML;

    // Display output with step-by-step execution
    output.innerHTML = `<pre>Recursion Execution Trace:
━━━━━━━━━━━━━━━━━━━━━━━━
Call Phase (Going Down):
  factorial(5) → factorial(4)
  factorial(4) → factorial(3)
  factorial(3) → factorial(2)
  factorial(2) → factorial(1)
  factorial(1) → BASE CASE

Return Phase (Coming Back Up):
  factorial(1) = 1
  factorial(2) = 2 × 1 = 2
  factorial(3) = 3 × 2 = 6
  factorial(4) = 4 × 6 = 24
  factorial(5) = 5 × 24 = 120

Final Result: 120</pre>`;
}

function generateRecursionTree(code) {
    const isFactorial = code.includes("factorial");
    const isFibonacci = code.includes("fibonacci");
    
    let treeHTML = `<div class="recursion-tree">`;
    treeHTML += `<div class="tree-title">Function Call Tree</div>`;
    
    if (isFactorial) {
        treeHTML += `
            <div class="tree-node root-node">
                <div class="node-content">factorial(5)</div>
                <div class="tree-level-1">
                    <div class="tree-branch">
                        <div class="tree-node">factorial(4)</div>
                    </div>
                    <div class="tree-branch-connector-down"></div>
                </div>
                <div class="tree-level-2">
                    <div class="tree-branch">
                        <div class="tree-node">factorial(3)</div>
                    </div>
                    <div class="tree-branch-connector-down"></div>
                </div>
                <div class="tree-level-3">
                    <div class="tree-branch">
                        <div class="tree-node">factorial(2)</div>
                    </div>
                    <div class="tree-branch-connector-down"></div>
                </div>
                <div class="tree-level-4">
                    <div class="tree-branch">
                        <div class="tree-node">factorial(1)</div>
                    </div>
                    <div class="tree-branch-connector-down"></div>
                </div>
                <div class="tree-level-5">
                    <div class="tree-branch">
                        <div class="tree-node base-node">Base: return 1</div>
                    </div>
                </div>
            </div>
        `;
    } else if (isFibonacci) {
        treeHTML += `
            <div class="tree-node root-node">
                <div class="node-content">fib(5)</div>
                <div class="tree-multi-branch">
                    <div class="tree-branch">
                        <div class="tree-node">fib(4)</div>
                    </div>
                    <div class="branch-divider">+</div>
                    <div class="tree-branch">
                        <div class="tree-node">fib(3)</div>
                    </div>
                </div>
            </div>
        `;
    }
    
    treeHTML += `</div>`;
    return treeHTML;
}

function generateCallFrames(code) {
    const isFibonacci = code.includes("fibonacci");
    const isFactorial = code.includes("factorial");
    
    let frames = [];
    
    if (isFactorial) {
        for (let i = 5; i >= 1; i--) {
            frames.push({
                call: `factorial(${i})`,
                n: i,
                isBase: i === 1,
                returnValue: i === 1 ? 1 : `${i} × factorial(${i - 1})`
            });
        }
    } else if (isFibonacci) {
        frames = [
            { call: "fibonacci(4)", n: 4, isBase: false, returnValue: "fibonacci(3) + fibonacci(2)" },
            { call: "fibonacci(3)", n: 3, isBase: false, returnValue: "fibonacci(2) + fibonacci(1)" },
            { call: "fibonacci(2)", n: 2, isBase: false, returnValue: "fibonacci(1) + fibonacci(0)" },
            { call: "fibonacci(1)", n: 1, isBase: true, returnValue: 1 },
            { call: "fibonacci(0)", n: 0, isBase: true, returnValue: 0 }
        ];
    } else {
        frames = [
            { call: "func(5)", n: 5, isBase: false, returnValue: "func(4) + func(3)" },
            { call: "func(4)", n: 4, isBase: false, returnValue: "func(3) + func(2)" },
            { call: "func(3)", n: 3, isBase: false, returnValue: "func(2) + func(1)" },
            { call: "func(2)", n: 2, isBase: false, returnValue: "func(1) + func(0)" },
            { call: "func(1)", n: 1, isBase: true, returnValue: 1 },
            { call: "func(0)", n: 0, isBase: true, returnValue: 0 }
        ];
    }
    
    return frames;
}

function resetCode() {
    const topic = topics[currentTopic];
    document.getElementById("codeEditor").value = topic.code;
    document.getElementById("output").innerHTML = '<p class="output-placeholder">Click "Visualize Memory" to see output...</p>';
    document.getElementById("memoryVisualizer").innerHTML = '';
}

async function explainWithAI() {
    const code = document.getElementById("codeEditor").value;
    const explanationBox = document.getElementById("explanationBox");
    const explanationText = document.getElementById("explanationText");

    explanationBox.classList.remove("hidden");
    explanationText.textContent = "🤔 Analyzing code...";

    try {
        const response = await fetch("/api/explain", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ code, topic: currentTopic })
        });

        const data = await response.json();
        explanationText.textContent = data.explanation;
    } catch (error) {
        console.log("[v0] AI API not available, using fallback explanations");
        
        const fallbackExplanations = {
            pointers: "This code demonstrates pointer basics. A pointer stores a memory address using the & operator to get an address and * to dereference it. Variables are stored at specific memory addresses in the stack, and pointers allow you to reference and manipulate them indirectly. This is fundamental to understanding dynamic memory allocation, function parameters, and data structures like linked lists.",
            recursion: "This code shows recursive function calls. Each call to factorial creates a new stack frame. The function calls itself with a smaller parameter until reaching the base case (n <= 1). Then each recursive call returns and passes the result back up the call stack. Understanding this call stack behavior is crucial for debugging recursion and avoiding stack overflow errors."
        };
        
        explanationText.textContent = fallbackExplanations[currentTopic] || "Unable to generate explanation. Try modifying your code.";
    }
}
