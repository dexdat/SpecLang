const fs = require('fs');
const path = require('path');

// Copy regex patterns from block-parser
const paramPattern = /^-\s+(\w+\??):\s*(.+?)\s+-\s*(.+)$/gm;
const returnPattern = /\*\*Returns:\*\*\s*([^\n]+?)(?:\s+-\s*(.+))?$/m;

const content = fs.readFileSync('specs/hello.spec.md', 'utf-8');
console.log('Content:');
console.log(content);

// Find block section
const blockMatch = content.match(/^###\s+@block:([a-zA-Z0-9_-]+)\s+@kind:(\w+)/m);
if (!blockMatch) {
    console.log('No block found');
    process.exit(1);
}
const startIndex = blockMatch.index;
const remaining = content.slice(startIndex);
const endMatch = remaining.match(/^###\s+@block:/m);
const section = endMatch ? remaining.slice(0, endMatch.index) : remaining;
console.log('\nSection:');
console.log(section);

// Parse parameters
const paramSection = section.match(/\*\*Parameters:\*\*([\s\S]*?)(?=\*\*|$)/);
console.log('\nParamSection match:', paramSection);
if (paramSection) {
    paramPattern.lastIndex = 0;
    let match;
    while ((match = paramPattern.exec(paramSection[1])) !== null) {
        console.log('Param match:', match);
    }
}

// Parse returns
returnPattern.lastIndex = 0;
const returnMatch = returnPattern.exec(section);
console.log('\nReturn match:', returnMatch);

// Also test with greeting spec
console.log('\n=== Greeting spec ===');
const greetingContent = fs.readFileSync('specs/greeting.spec.md', 'utf-8');
const greetingBlockMatch = greetingContent.match(/^###\s+@block:([a-zA-Z0-9_-]+)\s+@kind:(\w+)/m);
if (greetingBlockMatch) {
    const gStart = greetingBlockMatch.index;
    const gRemaining = greetingContent.slice(gStart);
    const gEndMatch = gRemaining.match(/^###\s+@block:/m);
    const gSection = gEndMatch ? gRemaining.slice(0, gEndMatch.index) : gRemaining;
    console.log('Greeting section:', gSection);
    const gParamSection = gSection.match(/\*\*Parameters:\*\*([\s\S]*?)(?=\*\*|$)/);
    console.log('Greeting paramSection:', gParamSection);
    if (gParamSection) {
        paramPattern.lastIndex = 0;
        let m;
        while ((m = paramPattern.exec(gParamSection[1])) !== null) {
            console.log('Greeting param match:', m);
        }
    }
    returnPattern.lastIndex = 0;
    const gReturnMatch = returnPattern.exec(gSection);
    console.log('Greeting return match:', gReturnMatch);
}