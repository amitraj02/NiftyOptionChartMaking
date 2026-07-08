Below is a comprehensive table you can use as a checklist or database schema for Price Action-based NIFTY Option Buying.

Category	Parameter	Description	Required	Use in Entry	Use in Exit
Date & Time	Date	Trading Date	✅	✅	✅
	Time	Candle Time	✅	✅	✅
	Day of Week	Monday-Friday	✅	❌	Analysis
	Time Session	Opening/Mid/Closing	✅	✅	Analysis
Index OHLC	Open	Candle Open	✅	✅	✅
	High	Candle High	✅	✅	✅
	Low	Candle Low	✅	✅	✅
	Close	Candle Close	✅	✅	✅
Candle Analysis	Body Size	|Close - Open|	✅	✅	✅
	Upper Wick	Selling Pressure	✅	✅	❌
	Lower Wick	Buying Pressure	✅	✅	❌
	Candle Range	High - Low	✅	✅	✅
	Candle Color	Bullish/Bearish	✅	✅	❌
Market Structure	Higher High (HH)	Trend Confirmation	✅	✅	❌
	Higher Low (HL)	Trend Confirmation	✅	✅	❌
	Lower High (LH)	Trend Reversal	✅	✅	❌
	Lower Low (LL)	Trend Reversal	✅	✅	❌
	Trend Direction	Up/Down/Sideways	✅	✅	✅
Swing Analysis	Swing High	Last Swing High	✅	✅	✅
	Swing Low	Last Swing Low	✅	✅	✅
	Swing Distance	Points	Optional	Analysis	Analysis
	Swing Break	Yes/No	✅	✅	❌
Support & Resistance	Previous Day High	PDH	✅	✅	✅
	Previous Day Low	PDL	✅	✅	✅
	Weekly High	WH	Optional	✅	❌
	Weekly Low	WL	Optional	✅	❌
	Resistance Level	Current Resistance	✅	✅	❌
	Support Level	Current Support	✅	✅	❌
Breakout	Breakout Detected	Yes/No	✅	✅	❌
	Breakout Strength	Strong/Weak	✅	✅	❌
	False Breakout	Yes/No	✅	❌	Analysis
	Retest	Completed?	✅	✅	❌
Volume	Current Volume	Candle Volume	Recommended	✅	❌
	Average Volume	20 Candle Avg	Recommended	✅	❌
	Volume Spike	Yes/No	Recommended	✅	❌
Momentum	Consecutive Bull Candles	Count	Optional	✅	❌
	Consecutive Bear Candles	Count	Optional	✅	❌
	Average Pullback	Points	Optional	Analysis	Analysis
Volatility	ATR	Average True Range	Recommended	✅	✅
	Range Expansion	Yes/No	Recommended	✅	❌
	Range Compression	Yes/No	Recommended	✅	❌
Indicators (Optional)	VWAP	Price Above/Below	Recommended	✅	✅
	EMA20	Trend Filter	Recommended	✅	✅
	EMA50	Trend Filter	Optional	✅	✅
Option Data	Strike Price	Selected Strike	✅	✅	✅
	Option Type	CE/PE	✅	✅	✅
	Entry Premium	Buy Price	✅	✅	❌
	Current Premium	Live Premium	✅	❌	✅
	Delta	Option Delta	Recommended	✅	❌
	Open Interest	OI	Recommended	Analysis	Analysis
	Volume	Option Volume	Recommended	✅	❌
	Bid-Ask Spread	Liquidity	Recommended	✅	❌
Risk Management	Entry Price	Buy Price	✅	✅	❌
	Stop Loss	Initial SL	✅	✅	✅
	Target	Profit Target	✅	✅	✅
	Risk Reward Ratio	R:R	✅	✅	Analysis
	Quantity	Lot Size	✅	✅	✅
Exit	Exit Price	Sell Price	✅	❌	✅
	Exit Time	Time	✅	❌	✅
	Exit Reason	Target/SL/Manual	✅	❌	✅
	Profit/Loss	₹ / Points	✅	❌	✅
Trade Notes	Entry Reason	Why Trade Taken	✅	✅	❌
	Mistake	Yes/No	Optional	❌	Analysis
	Screenshot	Chart Image	Optional	❌	Review