// Test React 19 exports
const React = require('react');

console.log('React exports:', Object.keys(React));
console.log('useState:', typeof React.useState);
console.log('useEffect:', typeof React.useEffect);
console.log('FC:', typeof React.FC);