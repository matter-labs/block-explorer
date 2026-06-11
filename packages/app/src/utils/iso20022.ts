// Parsing + pretty-printing for ISO 20022 pain.001.001.09 (Customer Credit
// Transfer Initiation) documents carried in Iso20022Token memo transfers.
//
// Parsing is best-effort: if the memo is not valid XML, or expected fields are
// missing, individual fields come back undefined and callers fall back to
// showing the raw memo string.

export type Iso20022Payment = {
  msgId?: string;
  creationDateTime?: string;
  instructionId?: string;
  endToEndId?: string;
  instructedAmount?: string;
  currency?: string;
  purposeCode?: string;
  debtorName?: string;
  // On-chain wallet address (DbtrAcct/Id/Othr/Id).
  debtorAccount?: string;
  debtorAgentBic?: string;
  creditorName?: string;
  // On-chain wallet address (CdtrAcct/Id/Othr/Id).
  creditorAccount?: string;
  creditorAgentBic?: string;
  remittanceInfo?: string;
};

// First direct child element matching a local name, ignoring namespace prefixes
// (pain.001 uses a default namespace, so prefix-based lookups are unreliable).
function childByLocalName(parent: Element | undefined, localName: string): Element | undefined {
  if (!parent) return undefined;
  for (let i = 0; i < parent.children.length; i++) {
    if (parent.children[i].localName === localName) {
      return parent.children[i];
    }
  }
  return undefined;
}

// Walks a strict parent → child path of local names. Traversing direct children
// at each step keeps DbtrAcct/CdtrAcct (and the two BICFI nodes) from colliding.
function resolvePath(root: Element | undefined, ...path: string[]): Element | undefined {
  let current = root;
  for (const localName of path) {
    current = childByLocalName(current, localName);
    if (!current) return undefined;
  }
  return current;
}

function textAtPath(root: Element | undefined, ...path: string[]): string | undefined {
  const el = resolvePath(root, ...path);
  const text = el?.textContent?.trim();
  return text ? text : undefined;
}

export function parseIso20022Pain001(xml: string): Iso20022Payment | null {
  try {
    const doc = new DOMParser().parseFromString(xml, "application/xml");
    // DOMParser reports malformed XML via a <parsererror> node rather than throwing.
    if (doc.getElementsByTagName("parsererror").length > 0) {
      return null;
    }

    // /Document/CstmrCdtTrfInitn
    const init = resolvePath(doc.documentElement ?? undefined, "CstmrCdtTrfInitn");
    if (!init) return null;

    const grpHdr = childByLocalName(init, "GrpHdr");
    const pmtInf = childByLocalName(init, "PmtInf");
    const txInf = childByLocalName(pmtInf, "CdtTrfTxInf");
    const instdAmt = resolvePath(txInf, "Amt", "InstdAmt");

    return {
      msgId: textAtPath(grpHdr, "MsgId"),
      creationDateTime: textAtPath(grpHdr, "CreDtTm"),
      instructionId: textAtPath(txInf, "PmtId", "InstrId"),
      endToEndId: textAtPath(txInf, "PmtId", "EndToEndId"),
      instructedAmount: instdAmt?.textContent?.trim() || undefined,
      currency: instdAmt?.getAttribute("Ccy") || undefined,
      purposeCode: textAtPath(txInf, "Purpose", "Cd"),
      debtorName: textAtPath(pmtInf, "Dbtr", "Nm"),
      debtorAccount: textAtPath(pmtInf, "DbtrAcct", "Id", "Othr", "Id"),
      debtorAgentBic: textAtPath(pmtInf, "DbtrAgt", "FinInstnId", "BICFI"),
      creditorName: textAtPath(txInf, "Cdtr", "Nm"),
      creditorAccount: textAtPath(txInf, "CdtrAcct", "Id", "Othr", "Id"),
      creditorAgentBic: textAtPath(txInf, "CdtrAgt", "FinInstnId", "BICFI"),
      remittanceInfo: textAtPath(txInf, "RmtInf", "Ustrd"),
    };
  } catch {
    return null;
  }
}

// Pretty-prints XML with two-space indentation for display. Returns the input
// unchanged if it cannot be parsed.
export function prettyPrintXml(xml: string): string {
  try {
    const doc = new DOMParser().parseFromString(xml, "application/xml");
    if (doc.getElementsByTagName("parsererror").length > 0) {
      return xml;
    }
    const indent = (node: Node, depth: number): string => {
      const pad = "  ".repeat(depth);
      const el = node as Element;
      const attrs = Array.from(el.attributes)
        .map((a) => ` ${a.name}="${a.value}"`)
        .join("");
      const childElements = Array.from(el.childNodes).filter(
        (n) => n.nodeType === Node.ELEMENT_NODE || (n.nodeType === Node.TEXT_NODE && n.textContent?.trim())
      );
      if (childElements.length === 0) {
        return `${pad}<${el.tagName}${attrs}/>`;
      }
      // Single text-only child renders inline: <Tag>value</Tag>
      if (childElements.length === 1 && childElements[0].nodeType === Node.TEXT_NODE) {
        return `${pad}<${el.tagName}${attrs}>${childElements[0].textContent?.trim()}</${el.tagName}>`;
      }
      const inner = childElements
        .filter((child) => child.nodeType === Node.ELEMENT_NODE)
        .map((child) => indent(child, depth + 1))
        .join("\n");
      return `${pad}<${el.tagName}${attrs}>\n${inner}\n${pad}</${el.tagName}>`;
    };
    return doc.documentElement ? indent(doc.documentElement, 0) : xml;
  } catch {
    return xml;
  }
}
