const typewriterTargets = document.querySelectorAll('[data-typewriter]');
const prefersReducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

if (!prefersReducedMotion) {
  for (const target of typewriterTargets) {
    const textNodes = [];
    const walker = document.createTreeWalker(target, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const node = walker.currentNode;
      if (node.textContent.trim()) {
        textNodes.push({ node, characters: Array.from(node.textContent) });
        node.textContent = '';
      }
    }

    target.classList.add('typewriter');
    const caret = document.createElement('span');
    caret.className = 'typewriter-caret';
    caret.setAttribute('aria-hidden', 'true');
    const firstTextNode = textNodes[0].node;
    firstTextNode.parentNode.insertBefore(caret, firstTextNode.nextSibling);

    const delay = Number(target.dataset.typewriterDelay) || 0;
    window.setTimeout(() => {
      let nodeIndex = 0;
      let characterIndex = 0;

      function typeNextCharacter() {
        const current = textNodes[nodeIndex];
        if (!current) {
          window.setTimeout(() => caret.remove(), 3000);
          return;
        }
        current.node.textContent += current.characters[characterIndex];
        current.node.parentNode.insertBefore(caret, current.node.nextSibling);
        characterIndex += 1;
        if (characterIndex >= current.characters.length) {
          nodeIndex += 1;
          characterIndex = 0;
        }
        window.setTimeout(typeNextCharacter, 48);
      }

      typeNextCharacter();
    }, delay);
  }
}
