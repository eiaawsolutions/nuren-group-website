import { useEffect } from 'react';
import { SEO, SITE_URL } from '../SEO';
import './investors.css';

const PATH = '/investors/prospectus';
// The investor site's preview embeds the prospectus from Google Drive.
const DRIVE_PREVIEW = 'https://drive.google.com/file/d/1cijMGyXzgLk6u_bAPxCi2IK6qgmgxUdX/preview';

// Copy is verbatim from the Nuren investor site's prospectus page.
export function ProspectusPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="ir-root ir-prospectus">
      <SEO
        title="Prospectus | Nuren Group Limited (NSX:NRN) - NSX Australia IPO 2024"
        description="Download Prospectus of Nuren Group Limited (NSX:NRN) IPO 2024 Australia. If you have any questions about the Offer or any other matter, please contact your professional advisor."
        canonical={`${SITE_URL}${PATH}`}
        breadcrumbs={[
          { name: 'Home', url: '/home' },
          { name: 'Investors', url: '/investors/corporate-governance' },
          { name: 'Prospectus', url: PATH },
        ]}
      />
      <div className="ir-prospectus-banner">
        <img src="/investors/prospectus-banner.jpg" alt="" />
      </div>

      <div className="ir-prospectus-content">
        <section>
          <h3>IMPORTANT DISCLAIMER</h3>
          <p>
            Before downloading, printing or viewing the Prospectus, please carefully read this information. By
            accessing the Prospectus, you agree to and acknowledge that you have read and accept the terms and
            conditions of access. The information on this page is not part of the Prospectus. If you do not
            understand it, you should consult your professional advisor.
          </p>
        </section>
        <section>
          <h3>IMPORTANT NOTICE</h3>
          <p>
            Nuren Group Limited ACN 673 015 597 (Company) has lodged a prospectus dated 28 May 2024 (Prospectus) with
            the Australian Securities and Investments Commission (ASIC) containing an offer of 3,000,000 ordinary
            shares in the Company, at an issue price of $0.20, raising a total of $600,000. We may accept
            oversubscription of up to an additional 500,000 ordinary shares at same issue price, raising an
            additional $100,000.
          </p>
          <br />
          <p>
            You should carefully consider these risks in light of your personal circumstances (including financial
            and tax issues) and seek professional guidance from your stockbroker, solicitor, accountant, financial
            adviser or other independent professional adviser before deciding whether to invest in Shares. There may
            also be risks in addition to these that should be considered, including in light of your personal
            circumstances.
          </p>
          <br />
          <p>
            Except as required by law, and only to the extent required, no person named in the Prospectus, nor any
            other person, warrants or guarantees the Company’s performance, the repayment of capital by the Company
            or any return on investment made pursuant to the Prospectus.
          </p>
          <br />
          <p>
            The Prospectus is an important document that should be read in its entirety before deciding whether or
            not to participate in the Offer. There are risks associated with an investment in Shares and some of the
            key risks are set out in Section 6 of the Prospectus. If you have any questions about the Offer or any
            other matter, please contact your professional advisor. Neither ASIC nor NSX, nor any of their respective
            officers, take any responsibility for the contents of the Prospectus or the merits of the investment to
            which the Prospectus relates.
          </p>
          <br />
          <p>
            The electronic copy of the Prospectus available on this website does not constitute an offer of, or an
            invitation to subscribe for, any securities. You may print out a hard copy of the Prospectus from this
            website or copy the electronic Prospectus on this website into an electronic file for your personal use
            only. You must not alter the contents of this electronic file in any way. Alternatively, you may also
            obtain a copy of the Prospectus by contacting the Share Registry at Automic Pty Ltd at 1300288664 (within
            Australia) or +612-96985414 (outside Australia) between 9:00am and 5:00pm AEDT (Monday to Friday) or
            email to hello@automic.com.au.
          </p>
          <br />
          <p>
            To the extent permitted by law, the Company is not liable for any loss incurred from accessing or
            downloading the Prospectus from this website, including, but not limited to, data corruption or
            download.
          </p>
        </section>
        <section>
          <h3>APPLICATIONS</h3>
          <p>
            Anyone who wants to acquire securities in the Company will need to carefully consider the Prospectus and
            complete an application form. The completed application form must be lodged, and the application monies
            paid, in accordance with the details set out in the Prospectus and application form. The Corporations Act
            2001 (Cth) prohibits any person from passing onto another person an Application Form unless it is
            attached to or accompanied by a complete and unaltered version of the Prospectus.
          </p>
          <br />
          <p> There are 2 application modes available:</p>
          <ul>
            <li>
              Option A: Apply online and pay electronically via&nbsp;
              <a href="https://apply.automic.com.au/NurenGroupLimited" target="_blank" rel="noopener noreferrer">
                https://apply.automic.com.au/NurenGroupLimited
              </a>
            </li>
            <li>Option B: Complete the physical application form attached to or accompanied by the Prospectus</li>
          </ul>
          <br />
          <p>Refer to the Prospectus for details of the applications process in relation to the Offer.</p>
          <br />
          <p>
            The Company reserves the right not to accept an application form from a person if it has reason to
            believe that when that person was given access to the electronic application form, it was not provided
            together with the Prospectus or any of those documents were incomplete or altered. If an application form
            is not completed correctly or if the accompanying payment is the wrong amount, the Company may, in its
            discretion, still treat the application form to be valid. The Company’s decision to treat an application
            as valid and how to construe, amend or complete the Application Form, will be final.
          </p>
        </section>
        <section>
          <h3>NO ADVICE</h3>
          <p>
            Nothing contained on this website or in the Prospectus constitutes investment, financial, legal, business,
            tax or other advice. In particular, the information on this website and in the Prospectus does not take
            into account your financial or investment objectives, financial situation or particular needs. In making
            an investment decision, you must rely on your own examination of the Company, the securities being
            offered for subscription and the terms of the offering, including the merits and risks involved. You
            should consult your professional advisor for investment, financial, legal, business or tax advice.
          </p>
        </section>
        <section>
          <h3>PERSONS TO WHOM THE PROSPECTUS IS AVAILABLE</h3>
          <p>
            For legal reasons, the electronic version of the Prospectus accessible through this website is available
            to persons accessing this website from within Australia only. If you are accessing this website from
            anywhere outside Australia, please do not download the electronic version of the Prospectus.
          </p>
          <br />
          <p>
            The Prospectus does not constitute an offer of, or invitation to apply for, securities in any
            jurisdiction where, or to any person to whom, it would not be lawful to issue the Prospectus or to make
            the offer or invitation. It is the responsibility of any applicant outside Australia to ensure compliance
            with all laws of any country relevant to their applications, and any such applicant should consult their
            professional advisor as to whether any government or other consents are required, or whether any
            formalities need to be observed to enable them to apply for and be allotted any securities.
          </p>
        </section>
        <section>
          <h3>DISCLAIMER</h3>
          <p>
            As set out in the Prospectus, it is proposed that the Shares will be quoted on the NSX. The Company, the
            Share Registry, and the Nominated Advisor (each as defined in the Prospectus) disclaim all liability,
            whether in negligence or otherwise, to persons who trade Shares before receiving their holding
            statements.
          </p>
        </section>
        <section>
          <h3>ACKNOWLEDGEMENT</h3>
          <p>
            This notice does not form part of the Prospectus. You must read it before you attempt to access the
            electronic version of the Prospectus on this website and indicate your agreement or otherwise at the
            bottom of this page.
          </p>
          <br />
          <p>By clicking the “Accept and Download” button below, you acknowledge and agree that:</p>
          <ul>
            <li>
              You have read and understood the above terms and conditions to access the electronic version of the
              Prospectus; and
            </li>
            <li>
              You are an Australian resident, and you are requesting a copy of the Prospectus from within Australia;{' '}
              <br />
              OR
              <br /> You are a non-Australian resident, you have consulted your professional advisor as to whether any
              governmental or other consents are required or whether any other formalities need to be considered and
              followed before accessing the Prospectus; and
            </li>
            <li>
              You will not pass onto any other person the application form unless it is attached to or accompanied by
              the complete and unaltered electronic version of the Prospectus.
            </li>
          </ul>
        </section>

        <hr />

        <div className="ir-ipo-ended">
          <em>
            Nuren Group Limited Public Offer is now closed. As of 26 June 2024, we have achieved maximum
            oversubscription. We like to express a heartfelt appreciation to all new and existing shareholders for the
            trust and support. We will keep you updated on the next step on the IPO journey. Thank You!
          </em>
        </div>
        {/* The investor site has the "Accept and Download" button commented out since the offer closed. */}
      </div>
    </div>
  );
}

/** /investors/prospectus/preview — the prospectus from Google Drive, as on the investor site. */
export function ProspectusPreviewPage() {
  return (
    <div className="ir-root ir-pdf-reader">
      <SEO
        title="Prospectus | Nuren Group Limited (NSX:NUR) - NSX Australia IPO 2024"
        description="Download Prospectus of Nuren Group Limited (NSX:NUR) IPO 2024 Australia. If you have any questions about the Offer or any other matter, please contact your professional advisor."
        canonical={`${SITE_URL}${PATH}/preview`}
      />
      <iframe src={DRIVE_PREVIEW} title="Nuren Group Limited prospectus" allow="autoplay" />
    </div>
  );
}
