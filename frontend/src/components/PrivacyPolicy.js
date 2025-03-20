import React from 'react';
import theme from '../theme/theme';
import Card from '../ui/Card';

const PrivacyPolicy = () => {
  return (
    <div style={{
      maxWidth: theme.layout.contentWidth,
      margin: '0 auto',
      padding: theme.spacing.xl,
      color: theme.colors.text.primary
    }}>
      <Card>
        <h1 style={{
          ...theme.typography.h1,
          color: theme.colors.primary,
          marginBottom: theme.spacing.xl,
          textAlign: 'center',
          borderBottom: `2px solid ${theme.colors.border}`,
          paddingBottom: theme.spacing.md
        }}>Privacy Policy</h1>
        
        <div style={{ display: 'grid', gap: theme.spacing.xl }}>
          <section>
            <h2 style={{
              ...theme.typography.h2,
              color: theme.colors.text.primary,
              marginBottom: theme.spacing.md
            }}>Overview</h2>
            <p style={{
              ...theme.typography.body,
              lineHeight: 1.6
            }}>This Privacy Policy explains how the Lyrics Syncer application handles data when you run it on your local machine.</p>
          </section>

          <section>
            <h2 style={{
              ...theme.typography.h2,
              color: theme.colors.text.primary,
              marginBottom: theme.spacing.md
            }}>Local Operation</h2>
            <p style={{
              ...theme.typography.body,
              lineHeight: 1.6
            }}>Lyrics Syncer is a self-hosted application that runs entirely on your local machine. We do not operate any servers that collect or store your data.</p>
          </section>

          <section>
            <h2 style={{
              ...theme.typography.h2,
              color: theme.colors.text.primary,
              marginBottom: theme.spacing.md
            }}>Data Collection</h2>
            <p style={{
              ...theme.typography.body,
              lineHeight: 1.6,
              marginBottom: theme.spacing.sm
            }}>The application does not collect or transmit any personal information. All data, including:</p>
            <ul style={{
              listStyle: 'none',
              padding: 0,
              margin: `${theme.spacing.md} 0`,
              display: 'grid',
              gap: theme.spacing.sm
            }}>
              {['Audio files', 'Lyrics', 'Album artwork', 'Generated images', 'API keys', 'Configuration settings'].map((item, index) => (
                <li key={index} style={{
                  ...theme.typography.body,
                  display: 'flex',
                  alignItems: 'center',
                  gap: theme.spacing.sm,
                  padding: theme.spacing.sm,
                  backgroundColor: theme.colors.background.light,
                  borderRadius: theme.borderRadius.sm
                }}>
                  <span style={{ color: theme.colors.primary }}>•</span>
                  {item}
                </li>
              ))}
            </ul>
            <p style={{
              ...theme.typography.body,
              lineHeight: 1.6
            }}>is stored locally on your machine and is under your complete control.</p>
          </section>

          <section>
            <h2 style={{
              ...theme.typography.h2,
              color: theme.colors.text.primary,
              marginBottom: theme.spacing.md
            }}>Third-Party Services</h2>
            <p style={{
              ...theme.typography.body,
              lineHeight: 1.6,
              marginBottom: theme.spacing.sm
            }}>The application interacts with the following third-party services when you provide the respective API keys:</p>
            <ul style={{
              listStyle: 'none',
              padding: 0,
              margin: `${theme.spacing.md} 0`,
              display: 'grid',
              gap: theme.spacing.sm
            }}>
              {['YouTube Data API', 'Genius API', 'Google Gemini API'].map((service, index) => (
                <li key={index} style={{
                  ...theme.typography.body,
                  display: 'flex',
                  alignItems: 'center',
                  gap: theme.spacing.sm,
                  padding: theme.spacing.sm,
                  backgroundColor: theme.colors.background.light,
                  borderRadius: theme.borderRadius.sm
                }}>
                  <span style={{ color: theme.colors.primary }}>•</span>
                  {service}
                </li>
              ))}
            </ul>
            <p style={{
              ...theme.typography.body,
              lineHeight: 1.6
            }}>Please review the privacy policies of these services as they may collect usage data according to their terms.</p>
          </section>

          <section>
            <h2 style={{
              ...theme.typography.h2,
              color: theme.colors.text.primary,
              marginBottom: theme.spacing.md
            }}>Data Storage</h2>
            <p style={{
              ...theme.typography.body,
              lineHeight: 1.6
            }}>All data is stored in local directories within the application folder. You can delete this data at any time using the "Clear All Cache" function in the settings.</p>
          </section>

          <section>
            <h2 style={{
              ...theme.typography.h2,
              color: theme.colors.text.primary,
              marginBottom: theme.spacing.md
            }}>Updates</h2>
            <p style={{
              ...theme.typography.body,
              lineHeight: 1.6
            }}>This privacy policy may be updated as the application evolves. Please review the project's GitHub repository for any changes.</p>
          </section>
        </div>
      </Card>
    </div>
  );
};

export default PrivacyPolicy;