import React from 'react';
import theme from '../theme/theme';
import Card from '../ui/Card';

const TermsOfService = () => {
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
        }}>Terms of Service</h1>
        
        <div style={{ display: 'grid', gap: theme.spacing.xl }}>
          <section>
            <h2 style={{
              ...theme.typography.h2,
              color: theme.colors.text.primary,
              marginBottom: theme.spacing.md
            }}>Acceptance of Terms</h2>
            <p style={{
              ...theme.typography.body,
              lineHeight: 1.6
            }}>By using Lyrics Syncer, you agree to these Terms of Service. If you disagree with any part of the terms, you may not use the application.</p>
          </section>

          <section>
            <h2 style={{
              ...theme.typography.h2,
              color: theme.colors.text.primary,
              marginBottom: theme.spacing.md
            }}>License</h2>
            <p style={{
              ...theme.typography.body,
              lineHeight: 1.6,
              marginBottom: theme.spacing.sm
            }}>Lyrics Syncer is open-source software licensed under the MIT License. You are free to:</p>
            <ul style={{
              listStyle: 'none',
              padding: 0,
              margin: `${theme.spacing.md} 0`,
              display: 'grid',
              gap: theme.spacing.sm
            }}>
              {[
                'Use the software for any purpose',
                'Study how the software works and modify it',
                'Redistribute the software',
                'Distribute modified versions of the software'
              ].map((item, index) => (
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
            }}>Subject to the conditions specified in the MIT License.</p>
          </section>

          <section>
            <h2 style={{
              ...theme.typography.h2,
              color: theme.colors.text.primary,
              marginBottom: theme.spacing.md
            }}>API Usage</h2>
            <p style={{
              ...theme.typography.body,
              lineHeight: 1.6,
              marginBottom: theme.spacing.sm
            }}>You are responsible for:</p>
            <ul style={{
              listStyle: 'none',
              padding: 0,
              margin: `${theme.spacing.md} 0`,
              display: 'grid',
              gap: theme.spacing.sm
            }}>
              {[
                'Obtaining your own API keys for YouTube, Genius, and Google Gemini services',
                'Complying with the respective terms of service of these third-party APIs',
                'Any costs associated with API usage',
                'Keeping your API keys secure'
              ].map((item, index) => (
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
          </section>

          <section>
            <h2 style={{
              ...theme.typography.h2,
              color: theme.colors.text.primary,
              marginBottom: theme.spacing.md
            }}>Content Usage</h2>
            <p style={{
              ...theme.typography.body,
              lineHeight: 1.6,
              marginBottom: theme.spacing.sm
            }}>When using Lyrics Syncer, you must:</p>
            <ul style={{
              listStyle: 'none',
              padding: 0,
              margin: `${theme.spacing.md} 0`,
              display: 'grid',
              gap: theme.spacing.sm
            }}>
              {[
                'Respect copyright and intellectual property rights',
                'Ensure you have the right to use any audio content',
                'Comply with relevant laws and regulations in your jurisdiction',
                'Not use the application for any illegal purposes'
              ].map((item, index) => (
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
          </section>

          <section>
            <h2 style={{
              ...theme.typography.h2,
              color: theme.colors.text.primary,
              marginBottom: theme.spacing.md
            }}>Disclaimer</h2>
            <p style={{
              ...theme.typography.body,
              lineHeight: 1.6,
              marginBottom: theme.spacing.sm
            }}>The software is provided "as is", without warranty of any kind. The developers are not responsible for:</p>
            <ul style={{
              listStyle: 'none',
              padding: 0,
              margin: `${theme.spacing.md} 0`,
              display: 'grid',
              gap: theme.spacing.sm
            }}>
              {[
                'Any errors or issues in the application',
                'Data loss or corruption',
                'Misuse of third-party APIs',
                'Any damages resulting from use of the software'
              ].map((item, index) => (
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
            }}>These terms may be updated as the application evolves. Please review the project's GitHub repository for any changes.</p>
          </section>
        </div>
      </Card>
    </div>
  );
};

export default TermsOfService;