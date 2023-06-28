import SummaryCard from '../components/summaryCard';

import classes from './styles.module.css';

export default function App() {
    const CARD_TESTS = [
        {
            summary: 'Test 1',
        },
        {
            summary: 'Test 2',
        },
        {
            summary: 'Test 3',
        },
        {
            summary: 'Test 4',
        },
    ];

    return (
        <div className={ classes.container }>
            <div className={ classes.essayContainer }>
                <textarea />
            </div>

            <div className={ classes.cardsContainer }>
                {
                    CARD_TESTS.map(
                        (card, index) => (
                            <SummaryCard
                                key={ index }
                                summary={ card.summary }
                            />
                        )
                    )
                }
            </div>
        </div>
    );
}
