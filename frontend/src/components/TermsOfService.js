import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import theme from '../theme/theme';
import Card from '../ui/Card';

const TermsOfService = () => {
  const { t } = useTranslation();
  
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
        }}>{t('terms.title')}</h1>
        
        <div style={{ display: 'grid', gap: theme.spacing.xl }}>
          <section>
            <p style={{
              ...theme.typography.body,
              lineHeight: 1.6
            }}>{t('terms.intro')}</p>
            <p style={{ 
              ...theme.typography.small,
              color: theme.colors.text.secondary, 
              marginTop: theme.spacing.md 
            }}>{t('terms.effective')}</p>
          </section>

          <section>
            <h2 style={{
              ...theme.typography.h2,
              color: theme.colors.text.primary,
              marginBottom: theme.spacing.md
            }}>{t('terms.acceptance.title')}</h2>
            <p style={{
              ...theme.typography.body,
              lineHeight: 1.6
            }}>{t('terms.acceptance.paragraph1')}</p>
          </section>

          <section>
            <h2 style={{
              ...theme.typography.h2,
              color: theme.colors.text.primary,
              marginBottom: theme.spacing.md
            }}>{t('terms.account.title')}</h2>
            <p style={{
              ...theme.typography.body,
              lineHeight: 1.6
            }}>{t('terms.account.paragraph1')}</p>
          </section>

          <section>
            <h2 style={{
              ...theme.typography.h2,
              color: theme.colors.text.primary,
              marginBottom: theme.spacing.md
            }}>{t('terms.content.title')}</h2>
            <p style={{
              ...theme.typography.body,
              lineHeight: 1.6,
              marginBottom: theme.spacing.sm
            }}>{t('terms.content.paragraph1')}</p>
            <p style={{
              ...theme.typography.body,
              lineHeight: 1.6
            }}>{t('terms.content.paragraph2')}</p>
          </section>

          <section>
            <h2 style={{
              ...theme.typography.h2,
              color: theme.colors.text.primary,
              marginBottom: theme.spacing.md
            }}>{t('terms.intellectual.title')}</h2>
            <p style={{
              ...theme.typography.body,
              lineHeight: 1.6,
              marginBottom: theme.spacing.sm
            }}>{t('terms.intellectual.paragraph1')}</p>
            <p style={{
              ...theme.typography.body,
              lineHeight: 1.6
            }}>{t('terms.intellectual.paragraph2')}</p>
          </section>

          <section>
            <h2 style={{
              ...theme.typography.h2,
              color: theme.colors.text.primary,
              marginBottom: theme.spacing.md
            }}>{t('terms.termination.title')}</h2>
            <p style={{
              ...theme.typography.body,
              lineHeight: 1.6
            }}>{t('terms.termination.paragraph1')}</p>
          </section>

          <section>
            <h2 style={{
              ...theme.typography.h2,
              color: theme.colors.text.primary,
              marginBottom: theme.spacing.md
            }}>{t('terms.disclaimer.title')}</h2>
            <p style={{
              ...theme.typography.body,
              lineHeight: 1.6
            }}>{t('terms.disclaimer.paragraph1')}</p>
          </section>

          <section>
            <h2 style={{
              ...theme.typography.h2,
              color: theme.colors.text.primary,
              marginBottom: theme.spacing.md
            }}>{t('terms.limitation.title')}</h2>
            <p style={{
              ...theme.typography.body,
              lineHeight: 1.6
            }}>{t('terms.limitation.paragraph1')}</p>
          </section>

          <section>
            <h2 style={{
              ...theme.typography.h2,
              color: theme.colors.text.primary,
              marginBottom: theme.spacing.md
            }}>{t('terms.changes.title')}</h2>
            <p style={{
              ...theme.typography.body,
              lineHeight: 1.6
            }}>{t('terms.changes.paragraph1')}</p>
          </section>
          
          <div style={{ 
            marginTop: theme.spacing.xl,
            textAlign: 'center'
          }}>
            <Link 
              to="/"
              style={{
                ...theme.typography.button,
                color: theme.colors.primary,
                textDecoration: 'none',
                padding: `${theme.spacing.sm} ${theme.spacing.lg}`,
                borderRadius: theme.borderRadius.sm,
                border: `1px solid ${theme.colors.primary}`,
                display: 'inline-block',
                transition: theme.transitions.fast
              }}
            >
              {t('terms.backToHome')}
            </Link>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default TermsOfService;