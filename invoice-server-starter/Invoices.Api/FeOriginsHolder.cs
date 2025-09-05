namespace Invoices.Api
{
    public sealed class FeOriginsHolder
    {
        public string[] Origins { get; }
        public FeOriginsHolder(string[] origins) => Origins = origins;
    }
}