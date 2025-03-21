import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import theme from '../theme/theme';
import Card from '../ui/Card';

const PrivacyPolicy = () => {
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
        }}>{t('privacy.title')}</h1>
        
        <div style={{ display: 'grid', gap: theme.spacing.xl }}>
          <section>
            <p style={{
              ...theme.typography.body,
              lineHeight: 1.6
            }}>{t('privacy.intro')}</p>
            <p style={{ 
              ...theme.typography.small,
              color: theme.colors.text.secondary, 
              marginTop: theme.spacing.md 
            }}>{t('privacy.effective')}</p>
          </section>

          <section>
            <h2 style={{
              ...theme.typography.h2,
              color: theme.colors.text.primary,
              marginBottom: theme.spacing.md
            }}>{t('privacy.collection.title')}</h2>
            <p style={{
              ...theme.typography.body,
              lineHeight: 1.6,
              marginBottom: theme.spacing.sm
            }}>{t('privacy.collection.paragraph1')}</p>
            <ul style={{
              listStyle: 'none',
              padding: 0,
              margin: `${theme.spacing.md} 0`,
              display: 'grid',
              gap: theme.spacing.sm
            }}>
              <li style={{
                ...theme.typography.body,
                display: 'flex',
                alignItems: 'center',
                gap: theme.spacing.sm,
                padding: theme.spacing.sm,
                backgroundColor: theme.colors.background.light,
                borderRadius: theme.borderRadius.sm
              }}>
                <span style={{ color: theme.colors.primary }}>•</span>
                {t('privacy.collection.item1')}
              </li>
              <li style={{
                ...theme.typography.body,
                display: 'flex',
                alignItems: 'center',
                gap: theme.spacing.sm,
                padding: theme.spacing.sm,
                backgroundColor: theme.colors.background.light,
                borderRadius: theme.borderRadius.sm
              }}>
                <span style={{ color: theme.colors.primary }}>•</span>
                {t('privacy.collection.item2')}
              </li>
              <li style={{
                ...theme.typography.body,
                display: 'flex',
                alignItems: 'center',
                gap: theme.spacing.sm,
                padding: theme.spacing.sm,
                backgroundColor: theme.colors.background.light,
                borderRadius: theme.borderRadius.sm
              }}>
                <span style={{ color: theme.colors.primary }}>•</span>
                {t('privacy.collection.item3')}
              </li>
            </ul>
          </section>

          <section>
            <h2 style={{
              ...theme.typography.h2,
              color: theme.colors.text.primary,
              marginBottom: theme.spacing.md
            }}>{t('privacy.usage.title')}</h2>
            <p style={{
              ...theme.typography.body,
              lineHeight: 1.6,
              marginBottom: theme.spacing.sm
            }}>{t('privacy.usage.paragraph1')}</p>
            <ul style={{
              listStyle: 'none',
              padding: 0,
              margin: `${theme.spacing.md} 0`,
              display: 'grid',
              gap: theme.spacing.sm
            }}>
              <li style={{
                ...theme.typography.body,
                display: 'flex',
                alignItems: 'center',
                gap: theme.spacing.sm,
                padding: theme.spacing.sm,
                backgroundColor: theme.colors.background.light,
                borderRadius: theme.borderRadius.sm
              }}>
                <span style={{ color: theme.colors.primary }}>•</span>
                {t('privacy.usage.item1')}
              </li>
              <li style={{
                ...theme.typography.body,
                display: 'flex',
                alignItems: 'center',
                gap: theme.spacing.sm,
                padding: theme.spacing.sm,
                backgroundColor: theme.colors.background.light,
                borderRadius: theme.borderRadius.sm
              }}>
                <span style={{ color: theme.colors.primary }}>•</span>
                {t('privacy.usage.item2')}
              </li>
              <li style={{
                ...theme.typography.body,
                display: 'flex',
                alignItems: 'center',
                gap: theme.spacing.sm,
                padding: theme.spacing.sm,
                backgroundColor: theme.colors.background.light,
                borderRadius: theme.borderRadius.sm
              }}>
                <span style={{ color: theme.colors.primary }}>•</span>
                {t('privacy.usage.item3')}
              </li>
            </ul>
          </section>

          <section>
            <h2 style={{
              ...theme.typography.h2,
              color: theme.colors.text.primary,
              marginBottom: theme.spacing.md
            }}>{t('privacy.sharing.title')}</h2>
            <p style={{
              ...theme.typography.body,
              lineHeight: 1.6
            }}>{t('privacy.sharing.paragraph1')}</p>
          </section>

          <section>
            <h2 style={{
              ...theme.typography.h2,
              color: theme.colors.text.primary,
              marginBottom: theme.spacing.md
            }}>{t('privacy.security.title')}</h2>
            <p style={{
              ...theme.typography.body,
              lineHeight: 1.6
            }}>{t('privacy.security.paragraph1')}</p>
          </section>

          <section>
            <h2 style={{
              ...theme.typography.h2,
              color: theme.colors.text.primary,
              marginBottom: theme.spacing.md
            }}>{t('privacy.changes.title')}</h2>
            <p style={{
              ...theme.typography.body,
              lineHeight: 1.6
            }}>{t('privacy.changes.paragraph1')}</p>
          </section>

          <section>
            <h2 style={{
              ...theme.typography.h2,
              color: theme.colors.text.primary,
              marginBottom: theme.spacing.md
            }}>{t('privacy.contact.title')}</h2>
            <p style={{
              ...theme.typography.body,
              lineHeight: 1.6
            }}>{t('privacy.contact.paragraph1')}</p>
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
              {t('privacy.backToHome')}
            </Link>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default PrivacyPolicy;