export interface GovernanceDoc {
  id: string;
  title: string;
  category: 'Charter' | 'Policy' | 'Statement';
  content: string;
}

export const governanceDocs: GovernanceDoc[] = [
  {
    id: 'audit-risk-charter',
    title: 'Audit and Risk Committee Charter',
    category: 'Charter',
    content: `
      <h2>1. Purpose</h2>
      <p>The Audit and Risk Committee is a committee of the Board of Nuren Group. Its primary purpose is to assist the Board in fulfilling its oversight responsibilities relating to the company's financial reporting, internal control systems, risk management framework, and the internal and external audit processes.</p>
      
      <h2>2. Composition</h2>
      <p>The Committee shall consist of at least three members, the majority of whom should be independent non-executive directors. The Chair of the Committee shall be an independent director who is not the Chair of the Board.</p>
      
      <h2>3. Responsibilities</h2>
      <ul>
        <li>Reviewing the integrity of the company's financial statements and periodic reports.</li>
        <li>Overseeing the relationship with the external auditor, including appointment and independence.</li>
        <li>Monitoring the effectiveness of the company's internal control and risk management systems.</li>
        <li>Reviewing the company's risk profile and risk appetite.</li>
        <li>Ensuring compliance with legal and regulatory requirements.</li>
      </ul>
    `
  },
  {
    id: 'board-charter',
    title: 'Board Charter',
    category: 'Charter',
    content: `
      <h2>1. Introduction</h2>
      <p>This Board Charter sets out the principles for the operation of the Board of Nuren Group and describes the functions and responsibilities of the Board and those functions delegated to management.</p>
      
      <h2>2. Role of the Board</h2>
      <p>The Board is responsible for the overall corporate governance of the company, including its strategic direction, establishing goals for management, and monitoring the achievement of these goals.</p>
      
      <h2>3. Specific Responsibilities</h2>
      <ul>
        <li>Defining the company's purpose and setting its strategic objectives.</li>
        <li>Approving the company's statement of values and code of conduct.</li>
        <li>Appointing and, where necessary, replacing the CEO.</li>
        <li>Overseeing management's implementation of the company's strategic objectives.</li>
        <li>Monitoring the company's financial performance and approving the annual budget.</li>
      </ul>
      
      <h2>4. Delegation to Management</h2>
      <p>The Board delegates to the CEO the authority and responsibility for managing the day-to-day operations of the company within the limits of the authority set by the Board.</p>
    `
  },
  {
    id: 'nomination-remuneration-charter',
    title: 'Nomination and Remuneration Committee Charter',
    category: 'Charter',
    content: `
      <h2>1. Purpose</h2>
      <p>The Nomination and Remuneration Committee assists the Board in ensuring that the Board is comprised of individuals who are best able to discharge the responsibilities of directors and that the company has appropriate remuneration policies to attract and retain high-quality personnel.</p>
      
      <h2>2. Nomination Responsibilities</h2>
      <ul>
        <li>Reviewing board succession plans.</li>
        <li>Identifying and recommending candidates for board vacancies.</li>
        <li>Developing and implementing a process for evaluating the performance of the Board.</li>
      </ul>
      
      <h2>3. Remuneration Responsibilities</h2>
      <ul>
        <li>Reviewing and recommending remuneration arrangements for the CEO and senior executives.</li>
        <li>Reviewing the company's remuneration framework to ensure it is fair and competitive.</li>
        <li>Overseeing the company's diversity and inclusion initiatives.</li>
      </ul>
    `
  },
  {
    id: 'anti-bribery-corruption',
    title: 'Anti Bribery and Corruption Policy',
    category: 'Policy',
    content: `
      <h2>1. Policy Statement</h2>
      <p>Nuren Group is committed to conducting its business with integrity and has zero tolerance for bribery and corruption. We are committed to acting professionally, fairly, and with integrity in all our business dealings and relationships.</p>
      
      <h2>2. Scope</h2>
      <p>This policy applies to all employees, directors, officers, consultants, and contractors of Nuren Group.</p>
      
      <h2>3. Prohibited Conduct</h2>
      <p>Employees must not offer, promise, give, request, or accept any bribe, kickback, or other improper payment or benefit to influence a business outcome or gain an unfair advantage.</p>
      
      <h2>4. Gifts and Hospitality</h2>
      <p>Gifts and hospitality must be reasonable, proportionate, and never given or received with the intention of influencing a business decision.</p>
    `
  },
  {
    id: 'diversity-policy',
    title: 'Diversity Policy',
    category: 'Policy',
    content: `
      <h2>1. Commitment to Diversity</h2>
      <p>Nuren Group recognizes that a diverse and inclusive workforce is a strength that leads to better decision-making and innovation. We are committed to providing an environment where all employees are treated with respect and have equal opportunities.</p>
      
      <h2>2. Objectives</h2>
      <ul>
        <li>To promote a culture of inclusion and respect.</li>
        <li>To ensure that recruitment and selection processes are based on merit and are free from bias.</li>
        <li>To support flexible work arrangements where appropriate.</li>
        <li>To achieve gender balance across all levels of the organization.</li>
      </ul>
      
      <h2>3. Measurable Objectives</h2>
      <p>The Board will set measurable objectives for achieving gender diversity and will assess annually both the objectives and the progress in achieving them.</p>
    `
  },
  {
    id: 'code-of-conduct',
    title: 'Code of Conduct',
    category: 'Policy',
    content: `
      <h2>1. Introduction</h2>
      <p>This Code of Conduct sets out the standards of behavior expected of all employees and directors of Nuren Group. It reflects our commitment to ethical business practices and our core values.</p>
      
      <h2>2. Standards of Behavior</h2>
      <ul>
        <li>Act with honesty, integrity, and fairness.</li>
        <li>Comply with all applicable laws and regulations.</li>
        <li>Respect the rights and dignity of others.</li>
        <li>Avoid conflicts of interest.</li>
        <li>Protect the company's confidential information and assets.</li>
      </ul>
      
      <h2>3. Reporting Breaches</h2>
      <p>Employees are encouraged to report any suspected breaches of this Code. Nuren Group will protect individuals who report concerns in good faith.</p>
    `
  },
  {
    id: 'ohs-policy',
    title: 'OH & S Policy',
    category: 'Policy',
    content: `
      <h2>1. Commitment</h2>
      <p>Nuren Group is committed to providing a safe and healthy work environment for all employees, contractors, and visitors. We believe that all workplace injuries and illnesses are preventable.</p>
      
      <h2>2. Responsibilities</h2>
      <ul>
        <li>Management is responsible for providing the necessary resources and training to ensure a safe workplace.</li>
        <li>Employees are responsible for following safety procedures and reporting hazards or incidents.</li>
      </ul>
      
      <h2>3. Continuous Improvement</h2>
      <p>We will regularly review our safety performance and strive for continuous improvement in our health and safety management systems.</p>
    `
  },
  {
    id: 'communication-disclosure',
    title: 'Communication and Disclosure Policy',
    category: 'Policy',
    content: `
      <h2>1. Purpose</h2>
      <p>This policy outlines Nuren Group's commitment to providing timely, complete, and accurate disclosure of information to the market, in accordance with our continuous disclosure obligations.</p>
      
      <h2>2. Continuous Disclosure</h2>
      <p>The company will immediately notify the market of any information that a reasonable person would expect to have a material effect on the price or value of its securities.</p>
      
      <h2>3. Communication with Shareholders</h2>
      <p>We aim to communicate effectively with our shareholders and provide them with ready access to balanced and understandable information about the company.</p>
    `
  },
  {
    id: 'risk-management',
    title: 'Risk Management Policy',
    category: 'Policy',
    content: `
      <h2>1. Introduction</h2>
      <p>Risk management is an integral part of Nuren Group's business strategy and operations. We aim to identify, assess, and manage risks to protect our people, assets, and reputation.</p>
      
      <h2>2. Risk Management Framework</h2>
      <p>Our framework includes processes for identifying risks, evaluating their impact and likelihood, and implementing appropriate mitigation strategies.</p>
      
      <h2>3. Roles and Responsibilities</h2>
      <p>The Board has overall responsibility for risk oversight, while management is responsible for implementing risk management processes within their respective areas.</p>
    `
  },
  {
    id: 'governance-statement',
    title: 'Corporate Governance Statement',
    category: 'Statement',
    content: `
      <h2>1. Overview</h2>
      <p>This Corporate Governance Statement outlines Nuren Group's governance framework and practices for the current reporting period. It describes how we have followed the principles and recommendations of the relevant governance codes.</p>
      
      <h2>2. Governance Framework</h2>
      <p>Our framework is designed to promote accountability, transparency, and ethical behavior. It includes our Board Charter, Committee Charters, and various corporate policies.</p>
      
      <h2>3. Annual Review</h2>
      <p>We review our governance practices annually to ensure they remain appropriate for the company's size and stage of development.</p>
    `
  },
  {
    id: 'securities-trading',
    title: 'Securities Trading Policy',
    category: 'Policy',
    content: `
      <h2>1. Purpose</h2>
      <p>This policy sets out the rules for directors and employees trading in Nuren Group securities. It is designed to prevent insider trading and ensure transparency.</p>
      
      <h2>2. Prohibited Trading</h2>
      <p>Directors and employees must not trade in company securities if they are in possession of inside information.</p>
      
      <h2>3. Trading Windows</h2>
      <p>Trading is generally only permitted during designated "trading windows" following the release of financial results, subject to prior clearance.</p>
    `
  },
  {
    id: 'delegation-authority',
    title: 'Delegation of Authority Policy',
    category: 'Policy',
    content: `
      <h2>1. Introduction</h2>
      <p>This policy defines the limits of authority delegated by the Board to management for various business transactions and commitments.</p>
      
      <h2>2. Principles of Delegation</h2>
      <ul>
        <li>Delegations are to positions, not individuals.</li>
        <li>Delegates must act within their authority and in the best interests of the company.</li>
        <li>Sub-delegation is only permitted where explicitly authorized.</li>
      </ul>
      
      <h2>3. Approval Limits</h2>
      <p>The policy sets out specific financial limits for capital expenditure, contracts, and other commitments.</p>
    `
  },
  {
    id: 'statement-values',
    title: 'Statement of Values',
    category: 'Statement',
    content: `
      <h2>1. Our Core Values</h2>
      <p>At Nuren Group, our values guide everything we do and define how we interact with our community, partners, and each other.</p>
      
      <ul>
        <li><strong>Trust:</strong> We build high-trust relationships through transparency and integrity.</li>
        <li><strong>Innovation:</strong> We constantly strive to find new and better ways to serve families.</li>
        <li><strong>Empathy:</strong> We put ourselves in the shoes of the families we serve.</li>
        <li><strong>Growth:</strong> We are committed to the continuous growth of our people and our business.</li>
        <li><strong>Impact:</strong> We aim to make a positive difference in the lives of families across Southeast Asia.</li>
      </ul>
    `
  }
];
